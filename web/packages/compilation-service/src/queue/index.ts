import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import { CompilationJob } from '../types/index.js';
import { getDb, schema } from '../db/index.js';
import { eq, desc } from 'drizzle-orm';

interface WorkerThread {
  worker: Worker;
  busy: boolean;
  id: number;
}

export class CompilationQueue extends EventEmitter {
  private workers: WorkerThread[] = [];
  private queue: CompilationJob[] = [];
  private jobs: Map<string, CompilationJob> = new Map();
  private workerIdCounter = 0;

  constructor(private maxWorkers: number = 2) {
    super();
  }

  async start(): Promise<void> {
    console.log(`🚀 Starting compilation queue with ${this.maxWorkers} workers`);
    
    for (let i = 0; i < this.maxWorkers; i++) {
      this.createWorker();
    }
  }

  async stop(): Promise<void> {
    console.log('⏹️  Stopping compilation queue');
    
    const workerPromises = this.workers.map(({ worker }) => {
      return new Promise<void>((resolve) => {
        worker.terminate(() => resolve());
      });
    });

    await Promise.all(workerPromises);
    this.workers = [];
    this.queue = [];
    this.jobs.clear();
  }

  private createWorker(): void {
    const workerId = this.workerIdCounter++;
    const worker = new Worker(new URL('./worker.js', import.meta.url));
    
    const workerThread: WorkerThread = {
      worker,
      busy: false,
      id: workerId
    };

    worker.on('message', (result) => {
      this.handleWorkerMessage(workerThread, result);
    });

    worker.on('error', (error) => {
      console.error(`Worker ${workerId} error:`, error);
      this.handleWorkerError(workerThread, error);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker ${workerId} stopped with exit code ${code}`);
        this.handleWorkerExit(workerThread);
      }
    });

    this.workers.push(workerThread);
    console.log(`👷 Worker ${workerId} created`);
  }

  private async handleWorkerMessage(workerThread: WorkerThread, result: { jobId: string; output?: string; error?: string }): Promise<void> {
    const job = this.jobs.get(result.jobId);
    if (!job) return;

    if (result.error) {
      job.status = 'failed';
      job.error = result.error;
    } else {
      job.status = 'completed';
      job.output = result.output;
    }

    job.completedAt = new Date();
    
    // Update database
    const db = getDb();
    await db.update(schema.compilationJobs)
      .set({
        status: job.status,
        output: job.output,
        error: job.error,
        completedAt: job.completedAt,
      })
      .where(eq(schema.compilationJobs.id, job.id));
    
    workerThread.busy = false;

    this.emit('jobCompleted', job);
    this.processQueue();
  }

  private handleWorkerError(workerThread: WorkerThread, error: Error): void {
    workerThread.busy = false;
    // Recreate worker on error
    const index = this.workers.indexOf(workerThread);
    if (index > -1) {
      this.workers.splice(index, 1);
      this.createWorker();
    }
  }

  private handleWorkerExit(workerThread: WorkerThread): void {
    workerThread.busy = false;
    // Recreate worker on exit
    const index = this.workers.indexOf(workerThread);
    if (index > -1) {
      this.workers.splice(index, 1);
      this.createWorker();
    }
  }

  async addJob(job: CompilationJob): Promise<void> {
    this.jobs.set(job.id, job);
    this.queue.push(job);
    
    // Persist to database
    const db = getDb();
    await db.insert(schema.compilationJobs).values({
      id: job.id,
      projectId: job.projectId,
      projectName: job.projectName,
      config: job.config,
      configPath: job.configPath,
      status: job.status,
      createdAt: job.createdAt,
    });
    
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;

    const job = this.queue.shift();
    if (!job) return;

    job.status = 'running';
    job.startedAt = new Date();
    availableWorker.busy = true;

    // Update database
    const db = getDb();
    await db.update(schema.compilationJobs)
      .set({
        status: 'running',
        startedAt: job.startedAt,
      })
      .where(eq(schema.compilationJobs.id, job.id));

    availableWorker.worker.postMessage({
      jobId: job.id,
      config: job.config,
      configPath: job.configPath
    });

    this.emit('jobStarted', job);
  }

  async getJob(jobId: string): Promise<CompilationJob | undefined> {
    // First check in-memory cache
    const memoryJob = this.jobs.get(jobId);
    if (memoryJob) return memoryJob;
    
    // Fall back to database
    const db = getDb();
    const dbJobs = await db.select()
      .from(schema.compilationJobs)
      .where(eq(schema.compilationJobs.id, jobId))
      .limit(1);
    
    if (dbJobs.length === 0) return undefined;
    
    const dbJob = dbJobs[0];
    return {
      id: dbJob.id,
      projectId: dbJob.projectId,
      projectName: dbJob.projectName,
      config: dbJob.config,
      configPath: dbJob.configPath || '',
      status: dbJob.status as any,
      output: dbJob.output || undefined,
      error: dbJob.error || undefined,
      createdAt: dbJob.createdAt,
      startedAt: dbJob.startedAt || undefined,
      completedAt: dbJob.completedAt || undefined,
    };
  }

  async getAllJobs(): Promise<CompilationJob[]> {
    // Get from database for persistence
    const db = getDb();
    const dbJobs = await db.select()
      .from(schema.compilationJobs)
      .orderBy(desc(schema.compilationJobs.createdAt));
    
    return dbJobs.map(dbJob => ({
      id: dbJob.id,
      projectId: dbJob.projectId,
      projectName: dbJob.projectName,
      config: dbJob.config,
      configPath: dbJob.configPath || '',
      status: dbJob.status as any,
      output: dbJob.output || undefined,
      error: dbJob.error || undefined,
      createdAt: dbJob.createdAt,
      startedAt: dbJob.startedAt || undefined,
      completedAt: dbJob.completedAt || undefined,
    }));
  }

  getStats(): { total: number; pending: number; running: number; completed: number; failed: number } {
    const jobs = this.getAllJobs();
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      running: jobs.filter(j => j.status === 'running').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length
    };
  }
}