import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod";

export const socialPostsTable = pgTable("social_posts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  text: text("text").notNull(),
  audience: text("audience").notNull().default("global"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const socialReactionsTable = pgTable("social_reactions", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  userId: text("user_id").notNull(),
  reaction: text("reaction").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const socialCommentsTable = pgTable("social_comments", {
  id: text("id").primaryKey(),
  postId: text("post_id").notNull(),
  userId: text("user_id").notNull(),
  parentId: text("parent_id"),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSocialPostSchema = createInsertSchema(socialPostsTable);
export const selectSocialPostSchema = createSelectSchema(socialPostsTable);
export const insertSocialReactionSchema = createInsertSchema(socialReactionsTable);
export const selectSocialReactionSchema = createSelectSchema(socialReactionsTable);
export const insertSocialCommentSchema = createInsertSchema(socialCommentsTable);
export const selectSocialCommentSchema = createSelectSchema(socialCommentsTable);

export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPostsTable.$inferSelect;
export type InsertSocialReaction = z.infer<typeof insertSocialReactionSchema>;
export type SocialReaction = typeof socialReactionsTable.$inferSelect;
export type InsertSocialComment = z.infer<typeof insertSocialCommentSchema>;
export type SocialComment = typeof socialCommentsTable.$inferSelect;
