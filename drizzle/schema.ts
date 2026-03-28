import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Training sessions created by trainers
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionCode: varchar("sessionCode", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  avatarId: varchar("avatarId", { length: 128 }).notNull(),
  avatarName: varchar("avatarName", { length: 128 }).notNull(),
  avatarPreviewUrl: text("avatarPreviewUrl"),
  mode: mysqlEnum("mode", ["train", "challenge", "ask", "watch"]).notNull(),
  language: varchar("language", { length: 16 }).default("en").notNull(),
  voiceId: varchar("voiceId", { length: 128 }),
  knowledgeBaseId: varchar("knowledgeBaseId", { length: 128 }),
  systemPrompt: text("systemPrompt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Documents uploaded to sessions
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize").notNull(),
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  extractedText: text("extractedText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
