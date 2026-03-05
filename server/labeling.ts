/**
 * AI Labeling Engine
 * Handles automated labeling for text, image, and audio using LLM and vision models
 */

import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";

/**
 * Text Labeling Results
 */
export interface TextLabelingResult {
  category?: string; // Primary category from classification
  sentiment?: string; // positive, negative, neutral
  entities?: Array<{ type: string; value: string; confidence: number }>;
  classification?: { category: string; confidence: number };
  language?: string;
  confidence: number;
}

/**
 * Sentiment Analysis
 */
export async function analyzeSentiment(text: string): Promise<{
  sentiment: string;
  confidence: number;
  explanation?: string;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a sentiment analysis expert. Analyze the sentiment of the given text and respond with ONLY valid JSON.",
      },
      {
        role: "user",
        content: `Analyze the sentiment of this text: "${text}"`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "sentiment_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            sentiment: {
              type: "string",
              enum: ["positive", "negative", "neutral"],
              description: "The sentiment classification",
            },
            confidence: {
              type: "number",
              description: "Confidence score from 0 to 100",
            },
          },
          required: ["sentiment", "confidence"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from LLM");

  const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  return {
    sentiment: parsed.sentiment,
    confidence: parsed.confidence,
  };
}

/**
 * Named Entity Recognition (NER)
 */
export async function extractEntities(text: string): Promise<{
  entities: Array<{ type: string; value: string; confidence: number }>;
  confidence: number;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a named entity recognition expert. Extract entities from text and respond with ONLY valid JSON.",
      },
      {
        role: "user",
        content: `Extract entities from this text: "${text}". Focus on: PERSON, ORGANIZATION, LOCATION, DATE, PRODUCT.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "entity_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            entities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: ["PERSON", "ORGANIZATION", "LOCATION", "DATE", "PRODUCT"],
                  },
                  value: { type: "string" },
                  confidence: { type: "number" },
                },
                required: ["type", "value", "confidence"],
                additionalProperties: false,
              },
            },
          },
          required: ["entities"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from LLM");

  const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  const avgConfidence =
    parsed.entities.length > 0 ? parsed.entities.reduce((sum: number, e: any) => sum + e.confidence, 0) / parsed.entities.length : 0;

  return {
    entities: parsed.entities,
    confidence: avgConfidence,
  };
}

/**
 * Text Classification
 */
export async function classifyText(text: string, categories: string[]): Promise<{
  category: string;
  confidence: number;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a text classification expert. Classify text into one of the given categories and respond with ONLY valid JSON.",
      },
      {
        role: "user",
        content: `Classify this text into one of these categories: ${categories.join(", ")}\n\nText: "${text}"`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "text_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: categories,
              description: "The classified category",
            },
            confidence: {
              type: "number",
              description: "Confidence score from 0 to 100",
            },
          },
          required: ["category", "confidence"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from LLM");

  const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  return {
    category: parsed.category,
    confidence: parsed.confidence,
  };
}

/**
 * Language Identification
 */
export async function identifyLanguage(text: string): Promise<{
  language: string;
  languageCode: string;
  confidence: number;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a language identification expert. Identify the language of the given text and respond with ONLY valid JSON.",
      },
      {
        role: "user",
        content: `Identify the language of this text: "${text}"`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "language_identification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            language: { type: "string", description: "Full language name" },
            languageCode: { type: "string", description: "ISO 639-1 language code" },
            confidence: { type: "number", description: "Confidence score from 0 to 100" },
          },
          required: ["language", "languageCode", "confidence"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from LLM");

  const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  return {
    language: parsed.language,
    languageCode: parsed.languageCode,
    confidence: parsed.confidence,
  };
}

/**
 * Image Labeling Results
 */
export interface ImageLabelingResult {
  classification?: { label: string; confidence: number };
  objects?: Array<{ label: string; confidence: number; bbox?: [number, number, number, number] }>;
  confidence: number;
}

/**
 * Image Classification using Vision API
 */
export async function classifyImage(imageUrl: string, categories: string[]): Promise<{
  label: string;
  confidence: number;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an image classification expert. Classify the image into one of the given categories and respond with ONLY valid JSON.",
      },
      {
        role: "user",
        content: [
          {
            type: "text" as const,
            text: `Classify this image into one of these categories: ${categories.join(", ")}`,
          },
          {
            type: "image_url" as const,
            image_url: {
              url: imageUrl,
              detail: "high" as const,
            },
          },
        ] as any,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "image_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            label: { type: "string", enum: categories },
            confidence: { type: "number" },
          },
          required: ["label", "confidence"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from LLM");

  const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  return {
    label: parsed.label,
    confidence: parsed.confidence,
  };
}

/**
 * Object Detection in Images
 */
export async function detectObjects(imageUrl: string): Promise<{
  objects: Array<{ label: string; confidence: number }>;
  confidence: number;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an object detection expert. Identify all objects in the image and respond with ONLY valid JSON. List the main objects detected.",
      },
      {
        role: "user",
        content: [
          {
            type: "text" as const,
            text: "Detect and list all objects in this image",
          },
          {
            type: "image_url" as const,
            image_url: {
              url: imageUrl,
              detail: "high" as const,
            },
          },
        ] as any,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "object_detection",
        strict: true,
        schema: {
          type: "object",
          properties: {
            objects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  confidence: { type: "number" },
                },
                required: ["label", "confidence"],
                additionalProperties: false,
              },
            },
          },
          required: ["objects"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from LLM");

  const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  const avgConfidence =
    parsed.objects.length > 0 ? parsed.objects.reduce((sum: number, o: any) => sum + o.confidence, 0) / parsed.objects.length : 0;

  return {
    objects: parsed.objects,
    confidence: avgConfidence,
  };
}

/**
 * Audio Labeling Results
 */
export interface AudioLabelingResult {
  transcription?: string;
  language?: string;
  events?: Array<{ type: string; confidence: number; timestamp?: number }>;
  speakers?: number;
  confidence: number;
}

/**
 * Audio Transcription using Whisper
 */
export async function transcribeAudioFile(audioUrl: string, language?: string): Promise<{
  transcription: string;
  language: string;
  confidence: number;
}> {
  const result = await transcribeAudio({
    audioUrl,
    language,
  });

  // Handle both WhisperResponse and TranscriptionError types
  if ('text' in result && 'language' in result) {
    return {
      transcription: (result as any).text,
      language: (result as any).language || "unknown",
      confidence: 95, // Whisper is generally very accurate
    };
  } else {
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Audio Event Classification
 */
export async function classifyAudioEvent(transcription: string, eventTypes: string[]): Promise<{
  events: Array<{ type: string; confidence: number }>;
  confidence: number;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are an audio event classification expert. Based on the audio transcription, classify what types of events or sounds are present and respond with ONLY valid JSON.",
      },
      {
        role: "user",
        content: `Based on this transcription, identify which of these event types are present: ${eventTypes.join(", ")}\n\nTranscription: "${transcription}"`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "audio_event_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: eventTypes },
                  confidence: { type: "number" },
                },
                required: ["type", "confidence"],
                additionalProperties: false,
              },
            },
          },
          required: ["events"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from LLM");

  const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  const avgConfidence =
    parsed.events.length > 0 ? parsed.events.reduce((sum: number, e: any) => sum + e.confidence, 0) / parsed.events.length : 0;

  return {
    events: parsed.events,
    confidence: avgConfidence,
  };
}

/**
 * Speaker Diarization Detection
 */
export async function detectSpeakers(transcription: string): Promise<{
  speakerCount: number;
  confidence: number;
}> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a speaker diarization expert. Based on the transcription, estimate how many distinct speakers are present and respond with ONLY valid JSON.",
      },
      {
        role: "user",
        content: `Estimate the number of distinct speakers in this transcription: "${transcription}"`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "speaker_detection",
        strict: true,
        schema: {
          type: "object",
          properties: {
            speakerCount: { type: "number", description: "Estimated number of speakers" },
            confidence: { type: "number", description: "Confidence score from 0 to 100" },
          },
          required: ["speakerCount", "confidence"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from LLM");

  const parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  return {
    speakerCount: parsed.speakerCount,
    confidence: parsed.confidence,
  };
}

/**
 * Comprehensive text labeling
 */
export async function labelText(text: string, taxonomyLabels: string[]): Promise<TextLabelingResult> {
  try {
    const [sentiment, entities, classification, language] = await Promise.all([
      analyzeSentiment(text),
      extractEntities(text),
      classifyText(text, taxonomyLabels),
      identifyLanguage(text),
    ]);

    return {
      category: classification.category,
      sentiment: sentiment.sentiment,
      entities: entities.entities,
      classification,
      language: language.languageCode,
      confidence: Math.min(sentiment.confidence, entities.confidence, classification.confidence, language.confidence),
    };
  } catch (error) {
    console.error("Text labeling error:", error);
    throw error;
  }
}

/**
 * Comprehensive image labeling
 */
export async function labelImage(imageUrl: string, taxonomyLabels: string[]): Promise<ImageLabelingResult> {
  try {
    const [classification, objects] = await Promise.all([
      classifyImage(imageUrl, taxonomyLabels),
      detectObjects(imageUrl),
    ]);

    return {
      classification,
      objects: objects.objects,
      confidence: Math.min(classification.confidence, objects.confidence),
    };
  } catch (error) {
    console.error("Image labeling error:", error);
    throw error;
  }
}

/**
 * Comprehensive audio labeling
 */
export async function labelAudio(audioUrl: string, eventTypes: string[]): Promise<AudioLabelingResult> {
  try {
    const transcription = await transcribeAudioFile(audioUrl);
    const [events, speakers] = await Promise.all([
      classifyAudioEvent(transcription.transcription, eventTypes),
      detectSpeakers(transcription.transcription),
    ]);

    return {
      transcription: transcription.transcription,
      language: transcription.language,
      events: events.events,
      speakers: speakers.speakerCount,
      confidence: Math.min(transcription.confidence, events.confidence, speakers.confidence),
    };
  } catch (error) {
    console.error("Audio labeling error:", error);
    throw error;
  }
}
