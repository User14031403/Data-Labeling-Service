import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

/**
 * Label taxonomy: Define categories and labels for different data types
 */
export const labelTaxonomy = mysqlTable("labelTaxonomy", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Sentiment Analysis", "Object Detection"
  dataType: mysqlEnum("dataType", ["text", "image", "audio"]).notNull(),
  description: text("description"),
  labels: text("labels").notNull(), // JSON array of label options
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LabelTaxonomy = typeof labelTaxonomy.$inferSelect;
export type InsertLabelTaxonomy = typeof labelTaxonomy.$inferInsert;

/**
 * Datasets: Store dataset metadata and file references
 */
export const datasets = mysqlTable("datasets", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  dataType: mysqlEnum("dataType", ["text", "image", "audio", "mixed"]).notNull(),
  ownerId: int("ownerId").notNull().references(() => users.id),
  status: mysqlEnum("status", ["active", "archived", "processing"]).default("active").notNull(),
  itemCount: int("itemCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Dataset = typeof datasets.$inferSelect;
export type InsertDataset = typeof datasets.$inferInsert;

/**
 * Dataset items: Individual items in a dataset (text, image, audio)
 */
export const datasetItems = mysqlTable("datasetItems", {
  id: int("id").autoincrement().primaryKey(),
  datasetId: int("datasetId").notNull().references(() => datasets.id, { onDelete: "cascade" }),
  content: text("content"), // For text data
  fileUrl: varchar("fileUrl", { length: 2048 }), // For image/audio files (S3 URL)
  fileKey: varchar("fileKey", { length: 1024 }), // S3 file key
  mimeType: varchar("mimeType", { length: 100 }),
  metadata: text("metadata"), // JSON: width, height, duration, etc.
  status: mysqlEnum("status", ["raw", "cleaned", "labeled", "error"]).default("raw").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DatasetItem = typeof datasetItems.$inferSelect;
export type InsertDatasetItem = typeof datasetItems.$inferInsert;

/**
 * Labeling tasks: Define labeling jobs and their configuration
 */
export const labelingTasks = mysqlTable("labelingTasks", {
  id: int("id").autoincrement().primaryKey(),
  datasetId: int("datasetId").notNull().references(() => datasets.id, { onDelete: "cascade" }),
  taxonomyId: int("taxonomyId").notNull().references(() => labelTaxonomy.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  progress: int("progress").default(0).notNull(), // Percentage 0-100
  totalItems: int("totalItems").notNull(),
  processedItems: int("processedItems").default(0).notNull(),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LabelingTask = typeof labelingTasks.$inferSelect;
export type InsertLabelingTask = typeof labelingTasks.$inferInsert;

/**
 * Labels: Store predicted and manual labels for dataset items
 */
export const labels = mysqlTable("labels", {
  id: int("id").autoincrement().primaryKey(),
  itemId: int("itemId").notNull().references(() => datasetItems.id, { onDelete: "cascade" }),
  taskId: int("taskId").notNull().references(() => labelingTasks.id, { onDelete: "cascade" }),
  predictedLabel: text("predictedLabel"), // JSON: label value(s) and confidence
  manualLabel: text("manualLabel"), // JSON: manually corrected label
  confidence: int("confidence"), // 0-100 confidence score
  source: mysqlEnum("source", ["ai", "manual", "hybrid"]).default("ai").notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Label = typeof labels.$inferSelect;
export type InsertLabel = typeof labels.$inferInsert;

/**
 * Batch jobs: Track REST API batch submissions
 */
export const batchJobs = mysqlTable("batchJobs", {
  id: int("id").autoincrement().primaryKey(),
  batchId: varchar("batchId", { length: 64 }).notNull().unique(), // UUID for external reference
  userId: int("userId").notNull().references(() => users.id),
  dataType: mysqlEnum("dataType", ["text", "image", "audio"]).notNull(),
  taxonomyId: int("taxonomyId").notNull().references(() => labelTaxonomy.id),
  status: mysqlEnum("status", ["submitted", "processing", "completed", "failed"]).default("submitted").notNull(),
  totalItems: int("totalItems").notNull(),
  processedItems: int("processedItems").default(0).notNull(),
  resultsUrl: varchar("resultsUrl", { length: 2048 }), // S3 URL to results JSON
  errorMessage: text("errorMessage"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  expiresAt: timestamp("expiresAt"), // Results expire after 30 days
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BatchJob = typeof batchJobs.$inferSelect;
export type InsertBatchJob = typeof batchJobs.$inferInsert;

/**
 * API keys: For batch API authentication
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  keyHash: varchar("keyHash", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;