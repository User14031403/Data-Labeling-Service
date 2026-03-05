/**
 * Background Job Processor
 * Handles asynchronous labeling tasks without blocking the main request
 */

import { getDb } from "./db";
import { getDatasetById, getDatasetItems, getLabelTaxonomy, createLabel, updateLabelingTaskProgress, getLabelingTask } from "./db";
import { labelText, labelImage, labelAudio } from "./labeling";

// Queue to store pending jobs
const jobQueue: Array<{ taskId: number; createdAt: Date }> = [];
let isProcessing = false;

/**
 * Add a labeling task to the background queue
 */
export function queueLabelingJob(taskId: number) {
  jobQueue.push({ taskId, createdAt: new Date() });
  // Start processing if not already running
  if (!isProcessing) {
    processNextJob();
  }
}

/**
 * Process the next job in the queue
 */
async function processNextJob() {
  if (jobQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const job = jobQueue.shift();
  if (!job) {
    isProcessing = false;
    return;
  }

  try {
    await processLabelingTask(job.taskId);
  } catch (error) {
    console.error(`Error processing labeling task ${job.taskId}:`, error);
    // Update task status to failed
    try {
      await updateLabelingTaskProgress(job.taskId, 0, "failed");
    } catch (updateError) {
      console.error(`Error updating task status:`, updateError);
    }
  }

  // Process next job in queue
  setImmediate(() => processNextJob());
}

/**
 * Process a single labeling task
 */
async function processLabelingTask(taskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get task using getLabelingTask helper
  const taskResults = await getLabelingTask(taskId);
  const taskResult = taskResults[0];

  if (!taskResult) throw new Error(`Task ${taskId} not found`);

  // Get dataset
  const datasetResult = await getDatasetById(taskResult.datasetId);
  if (!datasetResult[0]) throw new Error(`Dataset ${taskResult.datasetId} not found`);

  // Get taxonomy
  const taxonomyResult = await getLabelTaxonomy(taskResult.taxonomyId);
  if (!taxonomyResult[0]) throw new Error(`Taxonomy ${taskResult.taxonomyId} not found`);

  // Get items
  const items = await getDatasetItems(taskResult.datasetId);
  const taxonomyLabels = JSON.parse(taxonomyResult[0].labels);

  let processedCount = 0;

  for (const item of items) {
    try {
      let labelResult: any;

      if (datasetResult[0].dataType === "text" && item.content) {
        labelResult = await labelText(item.content, taxonomyLabels);
      } else if (datasetResult[0].dataType === "image" && item.fileUrl) {
        labelResult = await labelImage(item.fileUrl, taxonomyLabels);
      } else if (datasetResult[0].dataType === "audio" && item.fileUrl) {
        labelResult = await labelAudio(item.fileUrl, taxonomyLabels);
      }

      if (labelResult) {
        await createLabel({
          itemId: item.id,
          taskId: taskId,
          predictedLabel: JSON.stringify(labelResult),
          confidence: Math.round(labelResult.confidence),
          source: "ai",
        });
      }

      processedCount++;
      await updateLabelingTaskProgress(taskId, processedCount, "processing");
    } catch (error) {
      console.error(`Error labeling item ${item.id}:`, error);
    }
  }

  // Mark task as completed
  await updateLabelingTaskProgress(taskId, processedCount, "completed");
}
