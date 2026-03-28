/**
 * Gemini SDK wrapper for photo analysis and scope generation.
 *
 * Uses @google/generative-ai with config-level model abstraction
 * (Decision #8): models are selected via env vars so we can swap
 * between Flash / Pro / Preview without code changes.
 *
 * Key lesson from ScopeAI: maxOutputTokens MUST be 65536 to prevent
 * truncation — Gemini 2.5 Pro's "thinking" consumes output tokens.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { PHOTO_ANALYSIS_PROMPT, SCOPE_GENERATION_PROMPT } from "./prompts";

// ── SDK initialisation ──────────────────────────────────────────────

function getGenAI(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

function getVisionModel(): string {
  return process.env.GEMINI_VISION_MODEL ?? "gemini-2.5-flash";
}

function getTextModel(): string {
  return process.env.GEMINI_TEXT_MODEL ?? "gemini-2.5-flash";
}

// ── Photo analysis ──────────────────────────────────────────────────

export interface PhotoInput {
  base64: string;
  mimeType: string;
}

/**
 * Analyse job-site photos using Gemini's vision model.
 *
 * @param photos - Array of base64-encoded images with MIME types.
 * @param description - User-provided job description (already sanitised).
 * @returns Free-text analysis of the photos relevant to painting work.
 */
export async function analyzePhotos(
  photos: PhotoInput[],
  description: string,
): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: getVisionModel(),
    generationConfig: { maxOutputTokens: 65536 },
  });

  // Build the content parts: system prompt, then each photo, then user prompt
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [{ text: PHOTO_ANALYSIS_PROMPT }];

  for (const photo of photos) {
    parts.push({
      inlineData: {
        mimeType: photo.mimeType,
        data: photo.base64,
      },
    });
  }

  // User prompt with the job description
  parts.push({
    text: `Here is the job description provided by the painting contractor:\n\n${description}\n\nPlease analyse the photos above in the context of this painting job.`,
  });

  const result = await model.generateContent(parts);
  const text = result.response.text();

  if (!text || text.trim().length === 0) {
    throw new Error("Gemini returned an empty photo analysis response");
  }

  return text;
}

// ── Scope item generation ───────────────────────────────────────────

export interface ScopeDetails {
  description: string;
  propertyType?: string;
  scopeType?: string;
  surfaceTypes?: string[];
  specialRequirements?: string;
}

/**
 * Generate scope items as JSON using Gemini's text model.
 *
 * @param photoAnalysis - The text analysis from analyzePhotos().
 * @param scopeDetails - Structured job details from the user.
 * @returns Parsed JSON (unknown — caller must validate with Zod).
 */
export async function generateScopeItems(
  photoAnalysis: string,
  scopeDetails: ScopeDetails,
): Promise<unknown> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({
    model: getTextModel(),
    generationConfig: { maxOutputTokens: 65536 },
  });

  // Build a detailed user prompt from the scope details
  const userPromptLines = [
    "Based on the following photo analysis and job details, generate a comprehensive scope of works.",
    "",
    "=== PHOTO ANALYSIS ===",
    photoAnalysis,
    "",
    "=== JOB DETAILS ===",
    `Description: ${scopeDetails.description}`,
  ];

  if (scopeDetails.propertyType) {
    userPromptLines.push(`Property Type: ${scopeDetails.propertyType}`);
  }
  if (scopeDetails.scopeType) {
    userPromptLines.push(`Scope: ${scopeDetails.scopeType}`);
  }
  if (scopeDetails.surfaceTypes && scopeDetails.surfaceTypes.length > 0) {
    userPromptLines.push(
      `Surface Types: ${scopeDetails.surfaceTypes.join(", ")}`,
    );
  }
  if (scopeDetails.specialRequirements) {
    userPromptLines.push(
      `Special Requirements: ${scopeDetails.specialRequirements}`,
    );
  }

  userPromptLines.push(
    "",
    "Generate the scope items as a JSON array. Output ONLY the JSON array, no other text.",
  );

  const result = await model.generateContent([
    { text: SCOPE_GENERATION_PROMPT },
    { text: userPromptLines.join("\n") },
  ]);

  const text = result.response.text();

  if (!text || text.trim().length === 0) {
    throw new Error("Gemini returned an empty scope generation response");
  }

  // Parse JSON — strip any markdown code fences the model may have added
  const jsonText = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    // Try to find a JSON array in the response
    const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        // Fall through to the error below
      }
    }

    throw new Error(
      `Failed to parse Gemini response as JSON: ${
        err instanceof Error ? err.message : "Unknown parse error"
      }. First 200 chars: ${text.slice(0, 200)}`,
    );
  }
}
