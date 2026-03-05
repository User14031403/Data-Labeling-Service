import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  datasets,
  datasetItems,
  labelingTasks,
  labelTaxonomy,
  labels,
  batchJobs,
  apiKeys,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Dataset queries
export async function createDataset(input: {
  name: string;
  description?: string;
  dataType: "text" | "image" | "audio" | "mixed";
  ownerId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(datasets).values(input);
  return result;
}

export async function getDatasetById(datasetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(datasets).where(eq(datasets.id, datasetId)).limit(1);
}

export async function getUserDatasets(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(datasets).where(eq(datasets.ownerId, userId));
}

// Dataset items queries
export async function createDatasetItem(input: {
  datasetId: number;
  content?: string;
  fileUrl?: string;
  fileKey?: string;
  mimeType?: string;
  metadata?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(datasetItems).values(input);
}

export async function getDatasetItems(datasetId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(datasetItems).where(eq(datasetItems.datasetId, datasetId));
}

// Labeling task queries
export async function createLabelingTask(input: {
  datasetId: number;
  taxonomyId: number;
  name: string;
  description?: string;
  totalItems: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(labelingTasks).values(input);
}

export async function getLabelingTask(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(labelingTasks).where(eq(labelingTasks.id, taskId)).limit(1);
}

export async function updateLabelingTaskProgress(taskId: number, processedItems: number, status?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updates: any = { processedItems };
  if (status) updates.status = status;
  return db.update(labelingTasks).set(updates).where(eq(labelingTasks.id, taskId));
}

// Label taxonomy queries
export async function createLabelTaxonomy(input: {
  name: string;
  dataType: "text" | "image" | "audio";
  description?: string;
  labels: string; // JSON array
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(labelTaxonomy).values(input);
}

export async function getLabelTaxonomy(taxonomyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(labelTaxonomy).where(eq(labelTaxonomy.id, taxonomyId)).limit(1);
}

export async function getTaxonomiesByDataType(dataType: "text" | "image" | "audio") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(labelTaxonomy).where(eq(labelTaxonomy.dataType, dataType));
}

// Labels queries
export async function createLabel(input: {
  itemId: number;
  taskId: number;
  predictedLabel?: string;
  confidence?: number;
  source: "ai" | "manual" | "hybrid";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(labels).values(input);
}

export async function getItemLabels(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(labels).where(eq(labels.itemId, itemId));
}

export async function updateLabel(labelId: number, updates: { manualLabel?: string; reviewedBy?: number; reviewedAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(labels).set(updates).where(eq(labels.id, labelId));
}

// Batch job queries
export async function createBatchJob(input: {
  batchId: string;
  userId: number;
  dataType: "text" | "image" | "audio";
  taxonomyId: number;
  totalItems: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(batchJobs).values(input);
}

export async function getBatchJob(batchId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(batchJobs).where(eq(batchJobs.batchId, batchId)).limit(1);
}

export async function updateBatchJob(batchId: string, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(batchJobs).set(updates).where(eq(batchJobs.batchId, batchId));
}

// API key queries
export async function createApiKey(input: { userId: number; keyHash: string; name: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(apiKeys).values(input);
}

export async function getUserApiKeys(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(apiKeys).where(eq(apiKeys.userId, userId));
}
