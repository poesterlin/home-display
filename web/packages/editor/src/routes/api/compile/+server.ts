import { json } from "@sveltejs/kit";
import {
  submitCompilationJob,
  getJobStatus,
  getAllJobs,
} from "@esphome-designer/compilation-service";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { projectId, projectName, config, configPath } = await request.json();

    if (!projectId || !projectName || !config) {
      return json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await submitCompilationJob(
      projectId,
      projectName,
      config,
      configPath || ""
    );

    return json(result);
  } catch (error: any) {
    return json(
      { error: error.message },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async ({ url }) => {
  try {
    const jobId = url.searchParams.get("jobId");

    if (jobId) {
      const status = await getJobStatus(jobId);
      return json(status);
    }

    const allJobs = await getAllJobs();
    return json(allJobs);
  } catch (error: any) {
    return json(
      { error: error.message },
      { status: 500 }
    );
  }
};