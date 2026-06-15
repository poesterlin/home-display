import { json, error } from '@sveltejs/kit';
import { getJobStatus } from '$lib/utils/worker';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.user) throw error(401);

  const { jobId } = params;

  const job = await getJobStatus(jobId);
  if (!job || job.userId !== locals.user.id || job.status !== 'completed') {
    throw error(404, 'Firmware binary not found');
  }

  const manifest = {
    name: 'ESP32 Firmware',
    version: new Date().toISOString().split('T')[0],
    new_install_prompt_erase: true,
    builds: [
      {
        chipFamily: 'ESP32-S3',
        parts: [{ path: `/api/builds/${jobId}`, offset: 0 }],
      },
    ],
  };

  return json(manifest);
};
