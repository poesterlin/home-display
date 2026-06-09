import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/db';
import { compilationJobs } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { existsSync } from 'fs';
import { join } from 'path';
import { getStaticBuildsDir } from '$lib/server/static-paths';
import JSZip from 'jszip';
import {
  generateESPHomeYAML,
  generateUITypesHeader,
  generateUIStateHeader,
  generateUIScreensHeader,
  generateFontsYAML,
} from '$lib/codegen/esphome';
import { generateSecretsYAML } from '$lib/codegen/secrets';
import { validateProject } from '$lib/codegen/validations';
import { copyStaticTemplates } from '$lib/server/esphome-templates';
import { promises as fs } from 'fs';
import type { Project } from '@esphome-designer/schema';

const TEMPLATE_PREFIX = '../templates/';
const staticTemplates = import.meta.glob('../templates/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export const GET: RequestHandler = async ({ locals, params }) => {
  if (!locals.user) throw error(401);

  const db = getDb();
  const [job] = await db
    .select()
    .from(compilationJobs)
    .where(
      and(
        eq(compilationJobs.id, params.jobId),
        eq(compilationJobs.userId, locals.user.id),
      ),
    );

  if (!job) throw error(404, 'Job not found');

  try {
    const project = JSON.parse(job.config) as Project;

    // Strip OTA secrets
    const sanitizedProject = {
      ...project,
      secrets: { ...project.secrets, firmwareUpdateUrl: undefined },
    };

    const zip = new JSZip();
    const fileName = job.projectName.toLowerCase().replace(/\s+/g, '-');

    let baseFontsYaml = '';
    for (const [key, content] of Object.entries(staticTemplates)) {
      const relativePath = key.startsWith(TEMPLATE_PREFIX)
        ? key.slice(TEMPLATE_PREFIX.length)
        : key;
      if (relativePath === 'fonts.yaml') {
        baseFontsYaml = content;
        continue;
      }
      zip.file(relativePath, content);
    }

    zip.file('fonts.yaml', generateFontsYAML(sanitizedProject, baseFontsYaml));

    const validationErrors = validateProject(sanitizedProject);
    if (validationErrors.length > 0) {
      const messages = validationErrors.map((e) => `[${e.type}] ${e.message}`).join('; ');
      return json({ error: `Project validation failed: ${messages}` }, { status: 400 });
    }

    zip.file('includes/ui_types.h', generateUITypesHeader(sanitizedProject));
    zip.file('includes/ui_state.h', generateUIStateHeader(sanitizedProject));
    zip.file('includes/ui_screens.h', generateUIScreensHeader(sanitizedProject));
    zip.file(`${fileName}.yaml`, generateESPHomeYAML(sanitizedProject));

    const content = await zip.generateAsync({ type: 'nodebuffer' });

    return new Response(content, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': String(content.length),
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="${fileName}.zip"`,
      },
    });
  } catch (e: any) {
    console.error('Failed to generate ZIP for job', params.jobId, e);
    return json({ error: 'Failed to generate ZIP' }, { status: 500 });
  }
};
