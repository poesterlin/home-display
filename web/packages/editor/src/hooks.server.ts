import { startWorker, stopWorker } from "@esphome-designer/compilation-service";
import { getDb, schema } from "@esphome-designer/compilation-service/dist/db/index.js";
import type { Handle } from "@sveltejs/kit";
import { migrate } from "drizzle-orm/node-postgres/migrator";

let workerStarted = false;

// Initialize database and start worker on server startup
if (!workerStarted) {
  (async () => {
    try {
      console.log("🗄️  Initializing database...");
      const db = getDb();
      
      // Run migrations (if any exist)
      // Note: For initial setup, we'll use drizzle-kit push instead
      // await migrate(db, { migrationsFolder: "./drizzle" });
      
      console.log("✅ Database ready");
      
      startWorker(parseInt(process.env.CONCURRENT_JOBS || "2"));
      workerStarted = true;
      
      console.log("✅ Worker started");
    } catch (error) {
      console.error("❌ Failed to initialize:", error);
      process.exit(1);
    }
  })();

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("⏹️  SIGTERM received");
    await stopWorker();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    console.log("⏹️  SIGINT received");
    await stopWorker();
    process.exit(0);
  });
}

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event);
};