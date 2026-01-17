import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface WorkerMessage {
  jobId: string;
  config: string;
  configPath: string;
}

interface WorkerResult {
  jobId: string;
  output?: string;
  error?: string;
}

async function compileESPHome(jobId: string, config: string, configPath: string): Promise<string> {
  const tempDir = join('/tmp/esphome-builds', jobId);
  const configFile = join(tempDir, 'config.yaml');
  
  try {
    // Create temporary directory
    await fs.mkdir(tempDir, { recursive: true });
    
    // Write config file
    await fs.writeFile(configFile, config);
    
    // Run ESPHome compile
    return new Promise((resolve, reject) => {
      const process = exec(`esphome compile "${configFile}"`, {
        cwd: tempDir,
        timeout: 300000 // 5 minutes timeout
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout?.on('data', (data) => {
        stdout += data;
      });
      
      process.stderr?.on('data', (data) => {
        stderr += data;
      });
      
      process.on('exit', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`ESPHome compile failed: ${stderr}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
    });
  } finally {
    // Cleanup temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Failed to cleanup temp directory:', error);
    }
  }
}

// Handle messages from main thread
process.on('message', async (message: WorkerMessage) => {
  const { jobId, config, configPath } = message;
  
  try {
    const output = await compileESPHome(jobId, config, configPath);
    
    const result: WorkerResult = {
      jobId,
      output
    };
    
    process.send?.(result);
  } catch (error) {
    const result: WorkerResult = {
      jobId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    process.send?.(result);
  }
});