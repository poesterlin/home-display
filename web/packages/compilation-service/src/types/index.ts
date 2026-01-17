export interface CompilationJob {
  id: string;
  projectId: string;
  projectName: string;
  config: string;
  configPath: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CompilationRequest {
  projectId: string;
  projectName: string;
  config: string;
  configPath?: string;
}

export interface CompilationResult {
  jobId: string;
  status: CompilationJob['status'];
}