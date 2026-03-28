"use node";

/**
 * AI generation pipeline — the main action that orchestrates photo analysis,
 * scope generation, validation, and saving.
 *
 * Decision #12: Staged progress (analyzing → generating → validating)
 * Decision #14: Three-layer defense (sanitisation, prompt hardening, Zod validation)
 * Decision #17: Max 100 items per scope
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { analyzePhotos, generateScopeItems } from "./lib/gemini";
import type { PhotoInput, ScopeDetails } from "./lib/gemini";
import { sanitizeInput } from "./lib/prompts";
import { validateAndCleanScopeItems } from "./lib/validation";
import type { ScopeItemFromAI } from "./lib/validation";

// ── Configuration ───────────────────────────────────────────────────

/** Maximum retries for each Gemini API call. */
const MAX_RETRIES = 3;

/** Base delay for exponential backoff (ms). */
const BASE_DELAY_MS = 1000;

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Retry an async function with exponential backoff.
 * Only retries on transient errors (network, rate limit, server errors).
 */
async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on validation / input errors
      if (isNonRetryableError(lastError)) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(
          `[${label}] Attempt ${attempt}/${maxRetries} failed: ${lastError.message}. Retrying in ${delay}ms...`,
        );
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `[${label}] All ${maxRetries} attempts failed. Last error: ${lastError?.message}`,
  );
}

function isNonRetryableError(err: Error): boolean {
  const msg = err.message.toLowerCase();
  return (
    msg.includes("disallowed content") ||
    msg.includes("not authenticated") ||
    msg.includes("access denied") ||
    msg.includes("scope not found") ||
    msg.includes("insufficient credits") ||
    msg.includes("validation failed") ||
    msg.includes("api key")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a file from Convex storage and convert to base64 with MIME type.
 */
async function fetchStorageFileAsBase64(
  ctx: { storage: { getUrl: (id: Id<"_storage">) => Promise<string | null> } },
  storageId: Id<"_storage">,
): Promise<PhotoInput> {
  const url = await ctx.storage.getUrl(storageId);
  if (!url) {
    throw new Error(`Storage file not found: ${storageId}`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch storage file: ${response.status} ${response.statusText}`,
    );
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return {
    base64,
    mimeType: contentType,
  };
}

// Internal mutations are in convex/aiMutations.ts (Convex requires
// "use node" files to only export actions, not mutations).

// ── Main generation action ──────────────────────────────────────────

/**
 * The main AI generation pipeline.
 *
 * Steps:
 *   1. Verify scope exists and user owns it
 *   2. Deduct 1 credit
 *   3. Stage: "analyzing" — fetch photos, run vision model
 *   4. Stage: "generating" — run text model to produce scope items
 *   5. Stage: "validating" — validate with Zod, save items
 *   6. Update status to "generated"
 *
 * On failure: refund credit, set generationError, clear stage.
 */
export const generateScope = action({
  args: {
    scopeId: v.id("scopes"),
  },
  handler: async (ctx, { scopeId }) => {
    // ── 1. Verify scope and ownership (auth via public query) ──────
    const scope = await ctx.runQuery(api.scopes.getScope, { scopeId });

    if (scope.status !== "draft") {
      throw new Error("Scope has already been generated");
    }

    if (!scope.photos || scope.photos.length === 0) {
      throw new Error("At least one photo is required to generate a scope");
    }

    // ── 2. Deduct credit ──────────────────────────────────────────
    // Uses the public mutation which checks auth and enforces rate limits
    await ctx.runMutation(api.credits.deductCredit, {});

    // From this point on, if we fail we must refund the credit
    let creditDeducted = true;

    try {
      // ── 3. Stage: analyzing ───────────────────────────────────────
      await ctx.runMutation(internal.scopes.updateGenerationStage, {
        scopeId,
        generationStage: "analyzing",
      });

      // Sanitise user inputs
      const description = sanitizeInput(scope.description ?? "Painting job");
      const specialRequirements = scope.specialRequirements
        ? sanitizeInput(scope.specialRequirements)
        : undefined;

      // Fetch photos from Convex storage and convert to base64
      const photos: PhotoInput[] = [];
      for (const storageId of scope.photos) {
        const photo = await fetchStorageFileAsBase64(ctx, storageId as Id<"_storage">);
        photos.push(photo);
      }

      // Run photo analysis with retries
      const photoAnalysis = await withRetry("analyzePhotos", () =>
        analyzePhotos(photos, description),
      );

      // ── 4. Stage: generating ──────────────────────────────────────
      await ctx.runMutation(internal.scopes.updateGenerationStage, {
        scopeId,
        generationStage: "generating",
      });

      const scopeDetails: ScopeDetails = {
        description,
        propertyType: scope.propertyType ?? undefined,
        scopeType: scope.scopeType ?? undefined,
        surfaceTypes: scope.surfaceTypes ?? undefined,
        specialRequirements,
      };

      // Run scope generation with retries
      const rawItems = await withRetry("generateScopeItems", () =>
        generateScopeItems(photoAnalysis, scopeDetails),
      );

      // ── 5. Stage: validating ──────────────────────────────────────
      await ctx.runMutation(internal.scopes.updateGenerationStage, {
        scopeId,
        generationStage: "validating",
      });

      // Validate and clean with Zod (layer 3 of defense)
      const validatedItems = validateAndCleanScopeItems(rawItems);

      // Convert validated items to the shape expected by saveGeneratedItems
      const itemsToSave = validatedItems.map((item: ScopeItemFromAI) => ({
        category: item.category,
        description: item.description,
        quantity: item.quantity ?? undefined,
        unit: item.unit ?? undefined,
        confidence: item.confidence as "high" | "medium" | "low",
      }));

      // Save items to database
      await ctx.runMutation(internal.aiMutations.saveGeneratedItems, {
        scopeId,
        items: itemsToSave,
      });

      // ── 6. Update status to "generated" ───────────────────────────
      await ctx.runMutation(internal.scopes.updateStatus, {
        scopeId,
        status: "generated",
      });

      return {
        success: true,
        itemCount: validatedItems.length,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error during generation";

      console.error(`[generateScope] Failed for scope ${scopeId}:`, errorMessage);

      // Refund the credit
      if (creditDeducted) {
        try {
          await ctx.runMutation(api.credits.refundCredit, {});
          creditDeducted = false;
        } catch (refundErr) {
          console.error(
            `[generateScope] Failed to refund credit:`,
            refundErr instanceof Error ? refundErr.message : refundErr,
          );
        }
      }

      // Set the error on the scope and clear the generation stage
      try {
        await ctx.runMutation(internal.aiMutations.setGenerationError, {
          scopeId,
          error: errorMessage,
        });
      } catch (setErrErr) {
        console.error(
          `[generateScope] Failed to set generation error:`,
          setErrErr instanceof Error ? setErrErr.message : setErrErr,
        );
      }

      throw new Error(`Scope generation failed: ${errorMessage}`);
    }
  },
});
