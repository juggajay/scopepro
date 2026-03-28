import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Storage ─────────────────────────────────────────────────────────

/**
 * Generate a short-lived upload URL for Convex file storage.
 * Auth required — prevents anonymous uploads.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Get a public URL for a stored photo.
 * Auth required to prevent enumeration.
 */
export const getPhotoUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.getUrl(storageId);
  },
});

// ── Status transition order (high-water mark — never goes backwards) ──
const STATUS_ORDER = ["draft", "generated", "sent", "viewed"] as const;
type ScopeStatus = (typeof STATUS_ORDER)[number];

function isForwardTransition(
  current: ScopeStatus,
  next: ScopeStatus,
): boolean {
  return STATUS_ORDER.indexOf(next) > STATUS_ORDER.indexOf(current);
}

// ── Public queries ──────────────────────────────────────────────────

/**
 * Create a new scope in "draft" status.
 * Returns the new scope ID.
 */
export const create = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const now = Date.now();
    const id = await ctx.db.insert("scopes", {
      userId,
      status: "draft",
      photos: [],
      createdAt: now,
      updatedAt: now,
    });

    return id;
  },
});

/**
 * Get a single scope by ID.
 * Auth required. Verifies ownership. Excludes soft-deleted scopes.
 */
export const getScope = query({
  args: { scopeId: v.id("scopes") },
  handler: async (ctx, { scopeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scope = await ctx.db.get(scopeId);
    if (!scope) throw new Error("Scope not found");
    if (scope.userId !== userId) throw new Error("Access denied");
    if (scope.deletedAt !== undefined) throw new Error("Scope not found");

    return scope;
  },
});

/**
 * Get all scopes for the current user, excluding soft-deleted.
 * Ordered by createdAt desc.
 */
export const getUserScopes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Use the by_userId_deletedAt index to filter out deleted scopes.
    // deletedAt === undefined means not deleted.
    const scopes = await ctx.db
      .query("scopes")
      .withIndex("by_userId_deletedAt", (q) =>
        q.eq("userId", userId).eq("deletedAt", undefined),
      )
      .collect();

    // Sort by createdAt descending (newest first)
    scopes.sort((a, b) => b.createdAt - a.createdAt);

    return scopes;
  },
});

/**
 * Update editable scope fields.
 * Auth + ownership required. Only allows updates on non-deleted scopes.
 */
export const update = mutation({
  args: {
    scopeId: v.id("scopes"),
    description: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    scopeType: v.optional(
      v.union(
        v.literal("interior"),
        v.literal("exterior"),
        v.literal("both"),
      ),
    ),
    surfaceTypes: v.optional(v.array(v.string())),
    specialRequirements: v.optional(v.string()),
  },
  handler: async (ctx, { scopeId, ...fields }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scope = await ctx.db.get(scopeId);
    if (!scope) throw new Error("Scope not found");
    if (scope.userId !== userId) throw new Error("Access denied");
    if (scope.deletedAt !== undefined) throw new Error("Scope has been deleted");

    // Build patch with only the provided fields
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (fields.description !== undefined) patch.description = fields.description;
    if (fields.propertyType !== undefined)
      patch.propertyType = fields.propertyType;
    if (fields.scopeType !== undefined) patch.scopeType = fields.scopeType;
    if (fields.surfaceTypes !== undefined)
      patch.surfaceTypes = fields.surfaceTypes;
    if (fields.specialRequirements !== undefined)
      patch.specialRequirements = fields.specialRequirements;

    await ctx.db.patch(scopeId, patch);
  },
});

/**
 * Add a photo (storage ID) to the scope's photos array.
 * Max 6 photos per scope.
 */
export const addPhoto = mutation({
  args: {
    scopeId: v.id("scopes"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { scopeId, storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scope = await ctx.db.get(scopeId);
    if (!scope) throw new Error("Scope not found");
    if (scope.userId !== userId) throw new Error("Access denied");
    if (scope.deletedAt !== undefined) throw new Error("Scope has been deleted");

    if (scope.photos.length >= 6) {
      throw new Error("Maximum 6 photos per scope");
    }

    await ctx.db.patch(scopeId, {
      photos: [...scope.photos, storageId],
      updatedAt: Date.now(),
    });
  },
});

/**
 * Remove a photo (storage ID) from the scope's photos array.
 */
export const removePhoto = mutation({
  args: {
    scopeId: v.id("scopes"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { scopeId, storageId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scope = await ctx.db.get(scopeId);
    if (!scope) throw new Error("Scope not found");
    if (scope.userId !== userId) throw new Error("Access denied");
    if (scope.deletedAt !== undefined) throw new Error("Scope has been deleted");

    await ctx.db.patch(scopeId, {
      photos: scope.photos.filter((id) => id !== storageId),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Soft-delete a scope by setting deletedAt timestamp.
 */
export const softDelete = mutation({
  args: { scopeId: v.id("scopes") },
  handler: async (ctx, { scopeId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const scope = await ctx.db.get(scopeId);
    if (!scope) throw new Error("Scope not found");
    if (scope.userId !== userId) throw new Error("Access denied");
    if (scope.deletedAt !== undefined) throw new Error("Scope already deleted");

    await ctx.db.patch(scopeId, {
      deletedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ── Internal mutations (used by AI and email actions) ───────────────

/**
 * Update scope status. Only allows forward transitions:
 * draft → generated → sent → viewed
 */
export const updateStatus = internalMutation({
  args: {
    scopeId: v.id("scopes"),
    status: v.union(
      v.literal("draft"),
      v.literal("generated"),
      v.literal("sent"),
      v.literal("viewed"),
    ),
    generationStage: v.optional(
      v.union(
        v.literal("analyzing"),
        v.literal("generating"),
        v.literal("validating"),
      ),
    ),
    generationError: v.optional(v.string()),
  },
  handler: async (ctx, { scopeId, status, generationStage, generationError }) => {
    const scope = await ctx.db.get(scopeId);
    if (!scope) throw new Error("Scope not found");

    // Enforce forward-only status transitions
    if (!isForwardTransition(scope.status as ScopeStatus, status as ScopeStatus)) {
      throw new Error(
        `Invalid status transition: ${scope.status} → ${status}`,
      );
    }

    const patch: Record<string, unknown> = {
      status,
      updatedAt: Date.now(),
    };

    // Set or clear generationStage
    if (generationStage !== undefined) {
      patch.generationStage = generationStage;
    }

    // Set or clear generationError
    if (generationError !== undefined) {
      patch.generationError = generationError;
    }

    await ctx.db.patch(scopeId, patch);
  },
});

/**
 * Update the generationStage field for progress tracking.
 * Used by AI action to report progress.
 */
export const updateGenerationStage = internalMutation({
  args: {
    scopeId: v.id("scopes"),
    generationStage: v.union(
      v.literal("analyzing"),
      v.literal("generating"),
      v.literal("validating"),
    ),
  },
  handler: async (ctx, { scopeId, generationStage }) => {
    const scope = await ctx.db.get(scopeId);
    if (!scope) throw new Error("Scope not found");

    await ctx.db.patch(scopeId, {
      generationStage,
      updatedAt: Date.now(),
    });
  },
});
