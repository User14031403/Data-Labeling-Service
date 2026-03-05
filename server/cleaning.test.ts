import { describe, it, expect } from "vitest";
import {
  cleanText,
  removeDuplicateTexts,
  validateImageMetadata,
  isValidImageFile,
  validateAudioMetadata,
  isValidAudioFile,
} from "./cleaning";

describe("Text Cleaning", () => {
  it("should remove extra whitespace", () => {
    const result = cleanText("hello    world   test");
    expect(result).toBe("hello world test");
  });

  it("should trim leading and trailing whitespace", () => {
    const result = cleanText("   hello world   ");
    expect(result).toBe("hello world");
  });

  it("should normalize unicode characters", () => {
    const result = cleanText("café");
    expect(result).toBe("café");
  });

  it("should handle empty strings", () => {
    const result = cleanText("");
    expect(result).toBe("");
  });

  it("should remove control characters", () => {
    const result = cleanText("hello\x00world");
    expect(result).toBe("helloworld");
  });
});

describe("Duplicate Detection", () => {
  it("should identify duplicate texts", () => {
    const items = ["hello", "world", "hello", "test"];
    const result = removeDuplicateTexts(items);
    expect(result.unique.length).toBe(3);
    expect(result.duplicates.length).toBe(1);
    expect(result.duplicates[0]).toBe(2);
  });

  it("should handle case-insensitive duplicates", () => {
    const items = ["Hello", "hello", "HELLO"];
    const result = removeDuplicateTexts(items);
    expect(result.unique.length).toBe(1);
    expect(result.duplicates.length).toBe(2);
  });

  it("should handle empty array", () => {
    const items: string[] = [];
    const result = removeDuplicateTexts(items);
    expect(result.unique.length).toBe(0);
    expect(result.duplicates.length).toBe(0);
  });
});

describe("Image Validation", () => {
  it("should validate correct image metadata", () => {
    const metadata = { width: 1920, height: 1080, format: "jpeg", size: 1000000 };
    expect(validateImageMetadata(metadata)).toBe(true);
  });

  it("should reject images with invalid dimensions", () => {
    const metadata = { width: 5, height: 1080 };
    expect(validateImageMetadata(metadata)).toBe(false);
  });

  it("should reject images exceeding size limit", () => {
    const metadata = { size: 150 * 1024 * 1024 };
    expect(validateImageMetadata(metadata)).toBe(false);
  });

  it("should reject invalid image formats", () => {
    const metadata = { format: "bmp" };
    expect(validateImageMetadata(metadata)).toBe(false);
  });

  it("should validate image files by MIME type", () => {
    expect(isValidImageFile("image/jpeg", 1000000)).toBe(true);
    expect(isValidImageFile("image/png", 1000000)).toBe(true);
    expect(isValidImageFile("text/plain", 1000000)).toBe(false);
  });

  it("should reject zero-size image files", () => {
    expect(isValidImageFile("image/jpeg", 0)).toBe(false);
  });
});

describe("Audio Validation", () => {
  it("should validate correct audio metadata", () => {
    const metadata = { duration: 60, sampleRate: 44100, channels: 2, format: "mp3" };
    expect(validateAudioMetadata(metadata)).toBe(true);
  });

  it("should reject audio with invalid duration", () => {
    const metadata = { duration: 0.2 };
    expect(validateAudioMetadata(metadata)).toBe(false);
  });

  it("should reject audio exceeding duration limit", () => {
    const metadata = { duration: 4000 };
    expect(validateAudioMetadata(metadata)).toBe(false);
  });

  it("should reject invalid sample rates", () => {
    const metadata = { sampleRate: 32000 };
    expect(validateAudioMetadata(metadata)).toBe(false);
  });

  it("should validate audio files by MIME type", () => {
    expect(isValidAudioFile("audio/mpeg", 1000000)).toBe(true);
    expect(isValidAudioFile("audio/wav", 1000000)).toBe(true);
    expect(isValidAudioFile("video/mp4", 1000000)).toBe(false);
  });

  it("should reject zero-size audio files", () => {
    expect(isValidAudioFile("audio/mpeg", 0)).toBe(false);
  });
});
