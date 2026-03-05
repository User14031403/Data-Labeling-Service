import { Express, Request, Response } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { apiKeys, batchJobs } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Middleware to verify API key
export async function verifyApiKey(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.substring(7);
  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: "Database connection failed" });
  }

  try {
    const result = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, token)).limit(1);
    if (result.length === 0) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    (req as any).userId = result[0].userId;
    next();
  } catch (error) {
    console.error("API key verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Submit batch for labeling
export async function submitBatch(req: Request, res: Response) {
  try {
    const schema = z.object({
      datasetName: z.string(),
      dataType: z.enum(["text", "image", "audio"]),
      items: z.array(
        z.object({
          id: z.string().optional(),
          content: z.string().optional(),
          fileUrl: z.string().optional(),
        })
      ),
      taxonomyId: z.number(),
      taxonomyLabels: z.array(z.string()).optional(),
      labelingType: z.string().optional(),
    });

    const body = schema.parse(req.body);
    const userId = (req as any).userId;
    const batchId = nanoid();

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    // Create batch job
    await db.insert(batchJobs).values({
      batchId,
      userId,
      dataType: body.dataType,
      taxonomyId: body.taxonomyId,
      totalItems: body.items.length,
      status: "submitted",
    });

    res.json({
      batchId,
      status: "submitted",
      itemCount: body.items.length,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Submit batch error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request body", details: error.issues });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}

// Check batch status
export async function getBatchStatus(req: Request, res: Response) {
  try {
    const { batchId } = req.params;
    const userId = (req as any).userId;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    const result = await db
      .select()
      .from(batchJobs)
      .where(eq(batchJobs.batchId, batchId))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const batch = result[0];
    if (batch.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.json({
      batchId: batch.batchId,
      status: batch.status,
      totalItems: batch.totalItems,
      processedItems: batch.processedItems || 0,
      updatedAt: batch.updatedAt,
    });
  } catch (error) {
    console.error("Get batch status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Retrieve batch results
export async function getBatchResults(req: Request, res: Response) {
  try {
    const { batchId } = req.params;
    const userId = (req as any).userId;

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database connection failed" });
    }

    const result = await db
      .select()
      .from(batchJobs)
      .where(eq(batchJobs.batchId, batchId))
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ error: "Batch not found" });
    }

    const batch = result[0];
    if (batch.userId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (batch.status !== "completed") {
      return res.status(400).json({ error: "Batch not completed", status: batch.status });
    }

    if (!batch.resultsUrl) {
      return res.status(404).json({ error: "Results not available" });
    }

    res.json({
      batchId: batch.batchId,
      status: batch.status,
      resultsUrl: batch.resultsUrl,
      updatedAt: batch.updatedAt,
    });
  } catch (error) {
    console.error("Get batch results error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Register batch API routes
export function registerBatchApiRoutes(app: Express) {
  app.post("/api/batch/submit", verifyApiKey, submitBatch);
  app.get("/api/batch/status/:batchId", verifyApiKey, getBatchStatus);
  app.get("/api/batch/results/:batchId", verifyApiKey, getBatchResults);
}
