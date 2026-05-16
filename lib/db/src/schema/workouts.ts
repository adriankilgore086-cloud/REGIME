import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const workoutTemplatesTable = pgTable("workout_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  calories: integer("calories").notNull(),
  exercises: jsonb("exercises").$type<unknown[]>().notNull().default([]),
  targetMuscles: text("target_muscles").array().notNull().default([]),
  recoveryDays: integer("recovery_days").notNull(),
  xpReward: integer("xp_reward").notNull(),
  description: text("description").notNull(),
});

export const workoutSessionsTable = pgTable("workout_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  workoutId: text("workout_id").notNull(),
  scheduledWorkoutId: text("scheduled_workout_id"),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  durationMinutes: integer("duration_minutes").notNull(),
  calories: integer("calories").notNull(),
  xpEarned: integer("xp_earned").notNull(),
});

export const insertWorkoutTemplateSchema = createInsertSchema(workoutTemplatesTable);
export const selectWorkoutTemplateSchema = createSelectSchema(workoutTemplatesTable);
export const insertWorkoutSessionSchema = createInsertSchema(workoutSessionsTable);
export const selectWorkoutSessionSchema = createSelectSchema(workoutSessionsTable);

export type InsertWorkoutTemplate = z.infer<typeof insertWorkoutTemplateSchema>;
export type WorkoutTemplate = typeof workoutTemplatesTable.$inferSelect;
export type InsertWorkoutSession = z.infer<typeof insertWorkoutSessionSchema>;
export type WorkoutSession = typeof workoutSessionsTable.$inferSelect;
