/**
 * Zod output validation for AI-generated scope items.
 *
 * Uses Zod v4 (classic API) — same surface as v3: z.object(), z.string(), etc.
 * Decision #14: Three-layer defense — this is layer 3 (output validation).
 * Decision #17: Maximum 100 items per scope.
 */

import { z } from "zod";

// ── Schema definitions ──────────────────────────────────────────────

const VALID_CATEGORIES = [
  "Surface Preparation",
  "Priming",
  "Painting",
  "Protection & Masking",
  "Repairs & Patching",
  "Cleanup",
  "Materials",
  "Access Equipment",
  "Special Finishes",
] as const;

const VALID_CONFIDENCE = ["high", "medium", "low"] as const;

/**
 * Schema for a single scope item returned by the AI.
 */
export const scopeItemSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  quantity: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  confidence: z.enum(VALID_CONFIDENCE),
});

/**
 * Schema for the full array of scope items.
 * Enforces 1..100 items (Decision #17).
 */
export const scopeItemsArraySchema = z
  .array(scopeItemSchema)
  .min(1, "At least one scope item is required")
  .max(100, "Maximum 100 scope items allowed");

// ── Types ───────────────────────────────────────────────────────────

export type ScopeItemFromAI = z.infer<typeof scopeItemSchema>;

// ── Validation + cleanup ────────────────────────────────────────────

/**
 * Normalise a category string to one of the valid categories.
 * Returns the original string if no close match is found (will still
 * pass Zod since category is z.string(), but the UI can handle unknown).
 */
function normalizeCategory(raw: string): string {
  const lower = raw.toLowerCase().trim();

  for (const valid of VALID_CATEGORIES) {
    if (valid.toLowerCase() === lower) return valid;
  }

  // Fuzzy: check if the raw string contains a key word
  const keywordMap: Record<string, (typeof VALID_CATEGORIES)[number]> = {
    prep: "Surface Preparation",
    preparation: "Surface Preparation",
    sand: "Surface Preparation",
    prime: "Priming",
    primer: "Priming",
    seal: "Priming",
    paint: "Painting",
    coat: "Painting",
    topcoat: "Painting",
    protect: "Protection & Masking",
    mask: "Protection & Masking",
    drop: "Protection & Masking",
    repair: "Repairs & Patching",
    patch: "Repairs & Patching",
    fill: "Repairs & Patching",
    clean: "Cleanup",
    waste: "Cleanup",
    material: "Materials",
    product: "Materials",
    access: "Access Equipment",
    scaffold: "Access Equipment",
    ladder: "Access Equipment",
    special: "Special Finishes",
    feature: "Special Finishes",
    decorat: "Special Finishes",
    wallpaper: "Special Finishes",
  };

  for (const [keyword, category] of Object.entries(keywordMap)) {
    if (lower.includes(keyword)) return category;
  }

  // Fall back to original (trimmed)
  return raw.trim();
}

/**
 * Parse, validate, and clean up AI-generated scope items.
 *
 * @param raw — The unknown value parsed from Gemini's JSON output.
 * @returns A typed, cleaned array of scope items.
 * @throws Error with a descriptive message if validation fails.
 */
export function validateAndCleanScopeItems(raw: unknown): ScopeItemFromAI[] {
  // If the AI wrapped the array in an object (e.g. { items: [...] }), unwrap it
  let data = raw;
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    const obj = data as Record<string, unknown>;
    // Look for the first array-valued property
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) {
        data = obj[key];
        break;
      }
    }
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "AI output is not an array. Expected a JSON array of scope items.",
    );
  }

  // Pre-clean each item before Zod validation
  const cleaned = data.map((item: unknown, index: number) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Item at index ${index} is not an object.`);
    }

    const obj = item as Record<string, unknown>;

    return {
      category: normalizeCategory(String(obj.category ?? "")),
      description: String(obj.description ?? "").trim(),
      quantity: obj.quantity != null ? String(obj.quantity).trim() : null,
      unit: obj.unit != null ? String(obj.unit).trim() : null,
      confidence: String(obj.confidence ?? "medium").toLowerCase().trim(),
    };
  });

  // Validate with Zod
  const result = scopeItemsArraySchema.safeParse(cleaned);

  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map(
        (issue) =>
          `  - ${issue.path.join(".")}: ${issue.message}`,
      )
      .join("\n");

    throw new Error(
      `AI output validation failed:\n${issues}${
        result.error.issues.length > 5
          ? `\n  ... and ${result.error.issues.length - 5} more issues`
          : ""
      }`,
    );
  }

  return result.data;
}
