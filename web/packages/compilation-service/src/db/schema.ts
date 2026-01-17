import { pgTable, uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const compilationJobs = pgTable('compilation_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: varchar('project_id', { length: 255 }).notNull(),
  projectName: varchar('project_name', { length: 255 }).notNull(),
  config: text('config').notNull(),
  configPath: varchar('config_path', { length: 500 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  output: text('output'),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
});

export type CompilationJobDB = typeof compilationJobs.$inferSelect;
export type NewCompilationJobDB = typeof compilationJobs.$inferInsert;
