import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const healthMetricsTable = pgTable("health_metrics", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: text("date").notNull(),
  calories: integer("calories").notNull(),
  activeMinutes: integer("active_minutes").notNull(),
  muscleGroups: text("muscle_groups").array().notNull().default([]),
  steps: integer("steps"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHealthMetricSchema = createInsertSchema(healthMetricsTable);
export const selectHealthMetricSchema = createSelectSchema(healthMetricsTable);

export type InsertHealthMetric = z.infer<typeof insertHealthMetricSchema>;
export type HealthMetric = typeof healthMetricsTable.$inferSelect;
