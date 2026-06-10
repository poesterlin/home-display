import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/db';
import { projects, compilationJobs } from '$lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ensureS3, binKey } from '$lib/server/s3';
import { createLogger } from '$lib/server/logger';

export const GET: RequestHandler = async ({ params, request }) => {
  const db = getDb();

  const [project] = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.firmwareToken, params.token));

  if (!project) error(404, 'Not found');

  const [job] = await db
    .select({ id: compilationJobs.id, completedAt: compilationJobs.completedAt })
    .from(compilationJobs)
    .where(
      and(
        eq(compilationJobs.projectId, project.id),
        eq(compilationJobs.status, 'completed'),
        eq(compilationJobs.published, true),
      ),
    )
    .orderBy(desc(compilationJobs.completedAt));

  if (!job) error(404, 'No published firmware');

  const s3 = ensureS3();
  const s3File = s3.file(binKey(job.id));
  if (!(await s3File.exists())) error(404, 'Binary not found');

  const etag = `"${job.id}"`;
  const version = job.completedAt?.toISOString() ?? job.id;

  const logger = createLogger(params.token);
  const ifNoneMatch = request.headers.get('if-none-match');
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  logger.info(`update check: project="${project.name}" device="${userAgent}" etag=${ifNoneMatch ?? 'none'} current=${job.id}`);

  if (ifNoneMatch === etag) {
    logger.info(`up to date: project="${project.name}"`);
    return new Response(null, { status: 304 });
  }

  const { size } = await s3File.stat();
  logger.info(`serving update: project="${project.name}" size=${size}`);

  return new Response(s3File.stream(), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="firmware.bin"`,
      'Content-Length': String(size),
      'ETag': etag,
      'X-Esphome-Current-Version': version,
      'Cache-Control': 'no-store',
    },
  });
};
