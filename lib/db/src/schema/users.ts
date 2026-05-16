import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  age: integer("age").notNull().default(0),
  weight: integer("weight").notNull().default(0),
  height: integer("height").notNull().default(0),
  fitnessGoal: text("fitness_goal").notNull().default("general"),
  profileImage: text("profile_image"),
  bio: text("bio"),
  activeTitle: text("active_title"),
  unlockedTitles: text("unlocked_titles").array().notNull().default([]),
  isPremium: boolean("is_premium").notNull().default(false),
  pushToken: text("push_token"),
  pushPlatform: text("push_platform"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable);
export const selectUserSchema = createSelectSchema(usersTable);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
