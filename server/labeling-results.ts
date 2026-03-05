import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDatasetById, getDatasetItems, getItemLabels, getLabelingTask } from "./db";
import { protectedProcedure } from "./_core/trpc";

export const getTaskResults = protectedProcedure
  .input(z.object({ taskId: z.number() }))
  .query(async ({ ctx, input }) => {
    const taskResult = await getLabelingTask(input.taskId);
    if (!taskResult[0]) throw new TRPCError({ code: "NOT_FOUND" });

    const task = taskResult[0];
    const dataset = await getDatasetById(task.datasetId);
    if (dataset[0]?.ownerId !== ctx.user.id) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const items = await getDatasetItems(task.datasetId);
    const results = [];

    for (const item of items) {
      const itemLabels = await getItemLabels(item.id);
      const taskLabel = itemLabels.find((l) => l.taskId === input.taskId);

      results.push({
        itemId: item.id,
        content: item.content,
        fileUrl: item.fileUrl,
        predictedLabel: taskLabel?.predictedLabel ? JSON.parse(taskLabel.predictedLabel) : null,
        manualLabel: taskLabel?.manualLabel,
        confidence: taskLabel?.confidence,
        source: taskLabel?.source,
        reviewedBy: taskLabel?.reviewedBy,
        reviewedAt: taskLabel?.reviewedAt,
      });
    }

    return { task: task, results: results };
  });
