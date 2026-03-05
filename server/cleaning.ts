/**
 * Data Cleaning Pipeline
 * Handles cleaning for text, image, and audio data types
 */

import { DatasetItem } from "../drizzle/schema";

/**
 * Text Cleaning Pipeline
 */
export function cleanText(text: string): string {
  if (!text) return "";

  // Remove extra whitespace
  let cleaned = text.trim().replace(/\s+/g, " ");

  // Remove special control characters
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Normalize unicode
  cleaned = cleaned.normalize("NFKC");

  // Remove leading/trailing punctuation
  cleaned = cleaned.replace(/^[\s.,!?;:\'"\-()\[\]{}]+|[\s.,!?;:\'"\-()\[\]{}]+$/g, "");

  return cleaned;
}

/**
 * Detect and remove duplicate text items
 */
export function removeDuplicateTexts(items: string[]): { unique: string[]; duplicates: number[] } {
  const seen = new Map<string, number>();
  const unique: string[] = [];
  const duplicates: number[] = [];

  items.forEach((item, index) => {
    const normalized = cleanText(item).toLowerCase();
    if (seen.has(normalized)) {
      duplicates.push(index);
    } else {
      seen.set(normalized, index);
      unique.push(item);
    }
  });

  return { unique, duplicates };
}

/**
 * Image Cleaning Pipeline
 */
export interface ImageMetadata {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  hasAlpha?: boolean;
}

export function validateImageMetadata(metadata: Partial<ImageMetadata>): boolean {
  // Validate image dimensions
  if (metadata.width && metadata.width < 10) return false;
  if (metadata.height && metadata.height < 10) return false;

  // Validate file size (max 100MB)
  if (metadata.size && metadata.size > 100 * 1024 * 1024) return false;

  // Validate format - only allow specific formats
  const validFormats = ["jpeg", "jpg", "png", "webp", "gif"];
  if (metadata.format && !validFormats.includes(metadata.format.toLowerCase())) return false;

  return true;
}

/**
 * Detect corrupted or invalid images
 */
export function isValidImageFile(mimeType?: string, size?: number): boolean {
  const validMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];

  if (mimeType && !validMimeTypes.includes(mimeType)) return false;
  if (size !== undefined && size === 0) return false;
  if (size && size > 100 * 1024 * 1024) return false;

  return true;
}

/**
 * Audio Cleaning Pipeline
 */
export interface AudioMetadata {
  duration?: number; // in seconds
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
  format?: string;
  size?: number;
}

export function validateAudioMetadata(metadata: Partial<AudioMetadata>): boolean {
  // Validate duration (min 0.5s, max 1 hour)
  if (metadata.duration && (metadata.duration < 0.5 || metadata.duration > 3600)) return false;

  // Validate sample rate (common rates: 8000, 16000, 22050, 44100, 48000)
  const validSampleRates = [8000, 16000, 22050, 44100, 48000];
  if (metadata.sampleRate && !validSampleRates.includes(metadata.sampleRate)) return false;

  // Validate channels (mono=1, stereo=2)
  if (metadata.channels && (metadata.channels < 1 || metadata.channels > 8)) return false;

  // Validate file size (max 500MB)
  if (metadata.size && metadata.size > 500 * 1024 * 1024) return false;

  // Validate format - only allow specific formats
  const validFormats = ["mp3", "wav", "ogg", "m4a", "flac"];
  if (metadata.format && !validFormats.includes(metadata.format.toLowerCase())) return false;

  return true;
}

/**
 * Detect corrupted or invalid audio files
 */
export function isValidAudioFile(mimeType?: string, size?: number): boolean {
  const validMimeTypes = [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/mp4",
    "audio/flac",
    "audio/webm",
  ];

  if (mimeType && !validMimeTypes.includes(mimeType)) return false;
  if (size !== undefined && size === 0) return false;
  if (size && size > 500 * 1024 * 1024) return false;

  return true;
}

/**
 * Remove silence from audio metadata (detection only, actual processing would require audio library)
 */
export function estimateSilenceRemoval(duration: number, silenceThreshold: number = 0.1): number {
  // Estimate that ~10-20% of audio might be silence
  return Math.max(duration * (1 - silenceThreshold), 0);
}

/**
 * Generic cleaning function for dataset items
 */
export async function cleanDatasetItem(
  item: Partial<DatasetItem>,
  dataType: "text" | "image" | "audio"
): Promise<{
  cleaned: boolean;
  errors: string[];
  cleanedItem?: Partial<DatasetItem>;
}> {
  const errors: string[] = [];
  let cleaned = false;
  const cleanedItem: Partial<DatasetItem> = { ...item };

  try {
    if (dataType === "text") {
      if (item.content) {
        const originalLength = item.content.length;
        cleanedItem.content = cleanText(item.content);

        if (cleanedItem.content.length === 0) {
          errors.push("Text is empty after cleaning");
        } else if (cleanedItem.content !== item.content) {
          cleaned = true;
        }
      }
    } else if (dataType === "image") {
      const metadata = item.metadata ? JSON.parse(item.metadata) : {};
      if (!isValidImageFile(item.mimeType ?? undefined, metadata.size)) {
        errors.push("Invalid image file format or size");
      } else {
        cleaned = true;
      }
    } else if (dataType === "audio") {
      const metadata = item.metadata ? JSON.parse(item.metadata) : {};
      if (!isValidAudioFile(item.mimeType ?? undefined, metadata.size)) {
        errors.push("Invalid audio file format or size");
      } else {
        cleaned = true;
      }
    }
  } catch (error) {
    errors.push(`Cleaning error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return {
    cleaned: cleaned && errors.length === 0,
    errors,
    cleanedItem: errors.length === 0 ? cleanedItem : undefined,
  };
}
