import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { env } from '$env/dynamic/private';

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const connectionString = env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    db = drizzle({ schema });
  }

  return db;
}

export { schema };
