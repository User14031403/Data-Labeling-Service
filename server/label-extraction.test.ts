import { describe, expect, it } from "vitest";

// Helper function to extract labels (mirrors frontend logic)
function extractLabel(label: any): string {
  if (label === null || label === undefined) return "";
  if (typeof label === "string") return label;
  if (typeof label === "boolean") return String(label);
  if (typeof label === "number") return String(label);
  if (typeof label === "object") {
    // Check for classification.category (from AI labeling result)
    if (label.classification && typeof label.classification === "object" && label.classification.category) {
      return label.classification.category;
    }
    // Check for direct category field
    if (label.category) return label.category;
    // Check for label field (from image classification)
    if (label.label) return label.label;
    // Fallback to sentiment
    if (label.sentiment) return label.sentiment;
    // Fallback: return first non-object value
    for (const [key, value] of Object.entries(label)) {
      if (typeof value === "string") return value;
    }
    return JSON.stringify(label);
  }
  return String(label);
}

describe("Label Extraction", () => {
  it("should extract string labels directly", () => {
    expect(extractLabel("positive")).toBe("positive");
    expect(extractLabel("negative")).toBe("negative");
    expect(extractLabel("neutral")).toBe("neutral");
  });

  it("should extract classification.category as primary", () => {
    const obj = { classification: { category: "theorem", confidence: 0.95 }, sentiment: "neutral", confidence: 0.9 };
    expect(extractLabel(obj)).toBe("theorem");
  });

  it("should extract category field when classification not present", () => {
    const obj = { category: "operation", sentiment: "neutral", entities: [], confidence: 0.92 };
    expect(extractLabel(obj)).toBe("operation");
  });

  it("should extract label field when category not present", () => {
    const obj = { label: "positive", confidence: 0.95 };
    expect(extractLabel(obj)).toBe("positive");
  });

  it("should extract sentiment when category and label not present", () => {
    const obj = { sentiment: "positive", entities: [], confidence: 0.95 };
    expect(extractLabel(obj)).toBe("positive");
  });

  it("should extract classification when other fields not present", () => {
    const obj = { classification: "spam", confidence: 0.88 };
    expect(extractLabel(obj)).toBe("spam");
  });

  it("should handle complex labeling object with multiple fields", () => {
    const obj = {
      classification: { category: "definition", confidence: 0.92 },
      sentiment: "neutral",
      entities: ["entity1", "entity2"],
      language: "en",
      confidence: 0.9,
    };
    expect(extractLabel(obj)).toBe("definition");
  });

  it("should return first string value as fallback", () => {
    const obj = { confidence: 0.95, value: "extracted_label", other: 123 };
    expect(extractLabel(obj)).toBe("extracted_label");
  });

  it("should handle null and undefined", () => {
    expect(extractLabel(null)).toBe("");
    expect(extractLabel(undefined)).toBe("");
  });

  it("should handle empty object", () => {
    const result = extractLabel({});
    expect(result).toBe("{}");
  });

  it("should handle nested objects", () => {
    const obj = {
      classification: { category: "theorem", confidence: 0.95 },
      metadata: { nested: { value: "ignored" } },
    };
    expect(extractLabel(obj)).toBe("theorem");
  });

  it("should handle numeric values", () => {
    expect(extractLabel(123)).toBe("123");
    expect(extractLabel(0.95)).toBe("0.95");
  });

  it("should handle boolean values", () => {
    expect(extractLabel(true)).toBe("true");
    expect(extractLabel(false)).toBe("false");
  });
});
