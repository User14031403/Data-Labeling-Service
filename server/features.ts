/**
 * tRPC Feature Procedures
 * Handles datasets, labeling tasks, and batch operations
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import {
  createDataset,
  getDatasetById,
  getUserDatasets,
  createDatasetItem,
  getDatasetItems,
  createLabelingTask,
  getLabelingTask,
  updateLabelingTaskProgress,
  createLabelTaxonomy,
  getLabelTaxonomy,
  getTaxonomiesByDataType,
  createLabel,
  getItemLabels,
  updateLabel,
  createBatchJob,
  getBatchJob,
  updateBatchJob,
} from "./db";
import { cleanDatasetItem, removeDuplicateTexts } from "./cleaning";
import { labelText, labelImage, labelAudio } from "./labeling";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut, storageGet } from "./storage";

/**
 * Dataset Procedures
 */
export const datasetRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        dataType: z.enum(["text", "image", "audio", "mixed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createDataset({
        name: input.name,
        description: input.description,
        dataType: input.dataType,
        ownerId: ctx.user.id,
      });
      const datasets = await getUserDatasets(ctx.user.id);
      const newDataset = datasets[datasets.length - 1];
      return { success: true, datasetId: newDataset?.id };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const datasets = await getUserDatasets(ctx.user.id);
    return datasets;
  }),

  get: protectedProcedure
    .input(z.object({ datasetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await getDatasetById(input.datasetId);
      if (!result[0]) throw new TRPCError({ code: "NOT_FOUND" });
      if (result[0].ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return result[0];
    }),

  uploadItems: protectedProcedure
    .input(
      z.object({
        datasetId: z.number(),
        items: z.array(
          z.object({
            content: z.string().optional(),
            fileUrl: z.string().optional(),
            fileKey: z.string().optional(),
            mimeType: z.string().optional(),
            metadata: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dataset = await getDatasetById(input.datasetId);
      if (!dataset[0]) throw new TRPCError({ code: "NOT_FOUND" });
      if (dataset[0].ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      let addedCount = 0;
      for (const item of input.items) {
        await createDatasetItem({
          datasetId: input.datasetId,
          ...item,
        });
        addedCount++;
      }

      return { success: true, addedCount };
    }),

  getItems: protectedProcedure
    .input(z.object({ datasetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const dataset = await getDatasetById(input.datasetId);
      if (!dataset[0]) throw new TRPCError({ code: "NOT_FOUND" });
      if (dataset[0].ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await getDatasetItems(input.datasetId);
    }),
});

/**
 * Taxonomy Procedures
 */
export const taxonomyRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        dataType: z.enum(["text", "image", "audio"]),
        description: z.string().optional(),
        labels: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createLabelTaxonomy({
        name: input.name,
        dataType: input.dataType,
        description: input.description,
        labels: JSON.stringify(input.labels),
        createdBy: ctx.user.id,
      });
      const taxonomies = await getTaxonomiesByDataType(input.dataType);
      const newTaxonomy = taxonomies[taxonomies.length - 1];
      return { success: true, taxonomyId: newTaxonomy?.id };
    }),

  getByDataType: protectedProcedure
    .input(z.object({ dataType: z.enum(["text", "image", "audio"]) }))
    .query(async ({ input }) => {
      return await getTaxonomiesByDataType(input.dataType);
    }),

  get: protectedProcedure
    .input(z.object({ taxonomyId: z.number() }))
    .query(async ({ input }) => {
      const result = await getLabelTaxonomy(input.taxonomyId);
      if (!result[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        ...result[0],
        labels: JSON.parse(result[0].labels),
      };
    }),
});

/**
 * Labeling Task Procedures
 */
export const labelingRouter = router({
  createTask: protectedProcedure
    .input(
      z.object({
        datasetId: z.number(),
        taxonomyId: z.number(),
        name: z.string().min(1),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dataset = await getDatasetById(input.datasetId);
      if (!dataset[0]) throw new TRPCError({ code: "NOT_FOUND" });
      if (dataset[0].ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const items = await getDatasetItems(input.datasetId);
      await createLabelingTask({
        datasetId: input.datasetId,
        taxonomyId: input.taxonomyId,
        name: input.name,
        description: input.description,
        totalItems: items.length,
        createdBy: ctx.user.id,
      });

      // Get the newly created task
      const allTasks = await getLabelingTask(input.datasetId);
      const newTask = allTasks[0];
      return { success: true, taskId: newTask?.id };
    }),

  getTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ ctx, input }) => {
      const result = await getLabelingTask(input.taskId);
      if (!result[0]) throw new TRPCError({ code: "NOT_FOUND" });

      const dataset = await getDatasetById(result[0].datasetId);
      if (dataset[0]?.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return result[0];
    }),

  runLabeling: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const taskResult = await getLabelingTask(input.taskId);
      if (!taskResult[0]) throw new TRPCError({ code: "NOT_FOUND" });

      const task = taskResult[0];
      const dataset = await getDatasetById(task.datasetId);
      if (dataset[0]?.ownerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const taxonomy = await getLabelTaxonomy(task.taxonomyId);
      if (!taxonomy[0]) throw new TRPCError({ code: "NOT_FOUND" });

      const items = await getDatasetItems(task.datasetId);
      const taxonomyLabels = JSON.parse(taxonomy[0].labels);

      // Run labeling in background (simplified - in production use job queue)
      let processedCount = 0;
      for (const item of items) {
        try {
          let labelResult: any;

          if (dataset[0]?.dataType === "text" && item.content) {
            labelResult = await labelText(item.content, taxonomyLabels);
          } else if (dataset[0]?.dataType === "image" && item.fileUrl) {
            labelResult = await labelImage(item.fileUrl, taxonomyLabels);
          } else if (dataset[0]?.dataType === "audio" && item.fileUrl) {
            labelResult = await labelAudio(item.fileUrl, taxonomyLabels);
          }

          if (labelResult) {
            await createLabel({
              itemId: item.id,
              taskId: input.taskId,
              predictedLabel: JSON.stringify(labelResult),
              confidence: Math.round(labelResult.confidence),
              source: "ai",
            });
          }

          processedCount++;
          await updateLabelingTaskProgress(input.taskId, processedCount, "processing");
        } catch (error) {
          console.error(`Error labeling item ${item.id}:`, error);
        }
      }

      await updateLabelingTaskProgress(input.taskId, processedCount, "completed");
      return { success: true, processedCount };
    }),

  updateLabel: protectedProcedure
    .input(
      z.object({
        labelId: z.number(),
        manualLabel: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateLabel(input.labelId, {
        manualLabel: input.manualLabel,
        reviewedBy: ctx.user.id,
        reviewedAt: new Date(),
      });
      return { success: true };
    }),
});

/**
 * Batch API Procedures
 */
export const batchRouter = router({
  submitBatch: protectedProcedure
    .input(
      z.object({
        dataType: z.enum(["text", "image", "audio"]),
        taxonomyId: z.number(),
        items: z.array(
          z.object({
            content: z.string().optional(),
            fileUrl: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const batchId = nanoid();

      await createBatchJob({
        batchId,
        userId: ctx.user.id,
        dataType: input.dataType,
        taxonomyId: input.taxonomyId,
        totalItems: input.items.length,
      });

      // Process batch asynchronously (simplified)
      void processBatchAsync(batchId, ctx.user.id, input);

      return { batchId, status: "submitted" };
    }),

  getBatchStatus: publicProcedure
    .input(z.object({ batchId: z.string() }))
    .query(async ({ input }) => {
      const result = await getBatchJob(input.batchId);
      if (!result[0]) throw new TRPCError({ code: "NOT_FOUND" });
      return result[0];
    }),

  getBatchResults: publicProcedure
    .input(z.object({ batchId: z.string() }))
    .query(async ({ input }) => {
      const result = await getBatchJob(input.batchId);
      if (!result[0]) throw new TRPCError({ code: "NOT_FOUND" });

      if (result[0].status !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Batch not completed" });
      }

      if (!result[0].resultsUrl) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Results not found" });
      }

      // Return presigned URL to results
      const presignedUrl = await storageGet(result[0].resultsUrl);
      return { resultsUrl: presignedUrl.url };
    }),
});

/**
 * Background batch processing (simplified - in production use job queue)
 */
async function processBatchAsync(batchId: string, userId: number, input: any) {
  try {
    const results: any[] = [];
    const taxonomy = await getLabelTaxonomy(input.taxonomyId);
    if (!taxonomy[0]) return;

    const taxonomyLabels = JSON.parse(taxonomy[0].labels);

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i];
      let labelResult: any;

      try {
        if (input.dataType === "text" && item.content) {
          labelResult = await labelText(item.content, taxonomyLabels);
        } else if (input.dataType === "image" && item.fileUrl) {
          labelResult = await labelImage(item.fileUrl, taxonomyLabels);
        } else if (input.dataType === "audio" && item.fileUrl) {
          labelResult = await labelAudio(item.fileUrl, taxonomyLabels);
        }

        results.push({
          index: i,
          input: item,
          labels: labelResult,
          status: "success",
        });
      } catch (error) {
        results.push({
          index: i,
          input: item,
          error: error instanceof Error ? error.message : "Unknown error",
          status: "error",
        });
      }

      await updateBatchJob(batchId, { processedItems: i + 1 });
    }

    // Save results to S3
    const resultsKey = `batch-results/${batchId}.json`;
    const { url } = await storagePut(resultsKey, JSON.stringify(results), "application/json");

    await updateBatchJob(batchId, {
      status: "completed",
      resultsUrl: url,
      completedAt: new Date(),
    });
  } catch (error) {
    console.error(`Batch processing error for ${batchId}:`, error);
    await updateBatchJob(batchId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Export router combining all feature routers
 */
export const featureRouter = router({
  dataset: datasetRouter,
  taxonomy: taxonomyRouter,
  labeling: labelingRouter,
  batch: batchRouter,
});
