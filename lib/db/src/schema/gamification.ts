import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const xpEventsTable = pgTable("xp_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const achievementsUnlockedTable = pgTable("achievements_unlocked", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  achievementId: text("achievement_id").notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
});

export const streaksTable = pgTable("streaks", {
  userId: text("user_id").primaryKey(),
  streak: integer("streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastWorkoutDate: text("last_workout_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertXpEventSchema = createInsertSchema(xpEventsTable);
export const selectXpEventSchema = createSelectSchema(xpEventsTable);
export const insertAchievementUnlockedSchema = createInsertSchema(achievementsUnlockedTable);
export const selectAchievementUnlockedSchema = createSelectSchema(achievementsUnlockedTable);
export const insertStreakSchema = createInsertSchema(streaksTable);
export const selectStreakSchema = createSelectSchema(streaksTable);

export type InsertXpEvent = z.infer<typeof insertXpEventSchema>;
export type XpEvent = typeof xpEventsTable.$inferSelect;
export type InsertAchievementUnlocked = z.infer<typeof insertAchievementUnlockedSchema>;
export type AchievementUnlocked = typeof achievementsUnlockedTable.$inferSelect;
export type InsertStreak = z.infer<typeof insertStreakSchema>;
export type Streak = typeof streaksTable.$inferSelect;
