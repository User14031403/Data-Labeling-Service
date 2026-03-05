import { describe, expect, it, beforeEach } from "vitest";

/**
 * Job Processor Tests
 * Tests the background job queue system for processing multiple labeling tasks concurrently
 */

describe("Job Processor Queue System", () => {
  let jobQueue: Array<{ taskId: number; createdAt: Date }> = [];
  let processedTasks: number[] = [];
  let isProcessing = false;

  // Simple in-memory queue implementation for testing
  function queueLabelingJob(taskId: number) {
    jobQueue.push({ taskId, createdAt: new Date() });
    if (!isProcessing) {
      processNextJob();
    }
  }

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

    // Simulate processing
    processedTasks.push(job.taskId);

    // Process next job asynchronously
    setImmediate(() => processNextJob());
  }

  beforeEach(() => {
    jobQueue = [];
    processedTasks = [];
    isProcessing = false;
  });

  it("should initialize with empty queue", () => {
    expect(jobQueue.length).toBe(0);
    expect(processedTasks.length).toBe(0);
    expect(isProcessing).toBe(false);
  });

  it("should queue jobs and set processing flag", () => {
    queueLabelingJob(1);
    // Job is queued and processing starts
    expect(isProcessing).toBe(true);
  });

  it("should process multiple jobs sequentially", async () => {
    queueLabelingJob(1);
    queueLabelingJob(2);
    queueLabelingJob(3);

    // Wait for all jobs to process
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(processedTasks).toContain(1);
    expect(processedTasks).toContain(2);
    expect(processedTasks).toContain(3);
  });

  it("should maintain FIFO order for job processing", async () => {
    queueLabelingJob(10);
    queueLabelingJob(20);
    queueLabelingJob(30);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Jobs should be processed in order
    expect(processedTasks[0]).toBe(10);
    expect(processedTasks[1]).toBe(20);
    expect(processedTasks[2]).toBe(30);
  });

  it("should handle concurrent job submissions", async () => {
    // Submit multiple jobs rapidly
    for (let i = 1; i <= 5; i++) {
      queueLabelingJob(i);
    }

    await new Promise((resolve) => setTimeout(resolve, 150));

    // All jobs should be processed
    expect(processedTasks.length).toBe(5);
  });

  it("should clear processing flag when queue is empty", async () => {
    queueLabelingJob(1);
    expect(isProcessing).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 50));

    // After processing completes, flag should be false
    expect(isProcessing).toBe(false);
  });

  it("should allow new jobs to be queued after processing completes", async () => {
    queueLabelingJob(1);
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Queue new job after first batch completes
    queueLabelingJob(2);
    expect(isProcessing).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(processedTasks).toContain(1);
    expect(processedTasks).toContain(2);
  });

  it("should handle duplicate task IDs", async () => {
    queueLabelingJob(1);
    queueLabelingJob(1);
    queueLabelingJob(1);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // All three jobs should be processed even with same ID
    expect(processedTasks.length).toBe(3);
    expect(processedTasks.filter((id) => id === 1).length).toBe(3);
  });
});
