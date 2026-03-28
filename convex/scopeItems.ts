import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Verify the current user owns the scope.
 * Throws on auth failure, missing scope, or deleted scope.
 * Returns the authenticated userId.
 */
async function verifyScopeOwnership(
  ctx: { db: any; auth: any },
  scopeId: Id<"scopes">,
): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx as any);
  if (!userId) throw new Error("Not authenticated");

  const scope = await ctx.db.get(scopeId);
  if (!scope) throw new Error("Scope not found");
  if (scope.userId !== userId) throw new Error("Access denied");
  if (scope.deletedAt !== undefined) throw new Error("Scope has been deleted");

  return userId;
}

// ── Queries ─────────────────────────────────────────────────────────

/**
 * Get all items for a scope, ordered by sortOrder.
 * Auth required, verifies scope ownership.
 */
export const getItems = query({
  args: { scopeId: v.id("scopes") },
  handler: async (ctx, { scopeId }) => {
    await verifyScopeOwnership(ctx, scopeId);

    const items = await ctx.db
      .query("scopeItems")
      .withIndex("by_scopeId", (q: any) => q.eq("scopeId", scopeId))
      .collect();

    // Sort by sortOrder ascending
    items.sort((a: any, b: any) => a.sortOrder - b.sortOrder);

    return items;
  },
});

// ── Mutations ───────────────────────────────────────────────────────

/**
 * Add a new item to a scope.
 * Sets sortOrder to max+1. Enforces max 100 items per scope.
 */
export const addItem = mutation({
  args: {
    scopeId: v.id("scopes"),
    category: v.string(),
    description: v.string(),
    quantity: v.optional(v.string()),
    unit: v.optional(v.string()),
    isIncluded: v.boolean(),
    confidence: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low"),
    ),
  },
  handler: async (ctx, { scopeId, ...fields }) => {
    await verifyScopeOwnership(ctx, scopeId);

    // Get existing items to determine sortOrder and count
    const existingItems = await ctx.db
      .query("scopeItems")
      .withIndex("by_scopeId", (q) => q.eq("scopeId", scopeId))
      .collect();

    if (existingItems.length >= 100) {
      throw new Error("Maximum 100 items per scope");
    }

    // Find the max sortOrder, default to 0 if no items exist
    const maxSortOrder =
      existingItems.length > 0
        ? Math.max(...existingItems.map((item) => item.sortOrder))
        : 0;

    const id = await ctx.db.insert("scopeItems", {
      scopeId,
      category: fields.category,
      description: fields.description,
      quantity: fields.quantity,
      unit: fields.unit,
      isIncluded: fields.isIncluded,
      sortOrder: maxSortOrder + 1,
      confidence: fields.confidence,
    });

    return id;
  },
});

/**
 * Update item fields (description, quantity, unit, category).
 * Auth + scope ownership required.
 */
export const updateItem = mutation({
  args: {
    itemId: v.id("scopeItems"),
    description: v.optional(v.string()),
    quantity: v.optional(v.string()),
    unit: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, { itemId, ...fields }) => {
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");

    await verifyScopeOwnership(ctx, item.scopeId);

    // Build patch with only the provided fields
    const patch: Record<string, unknown> = {};
    if (fields.description !== undefined) patch.description = fields.description;
    if (fields.quantity !== undefined) patch.quantity = fields.quantity;
    if (fields.unit !== undefined) patch.unit = fields.unit;
    if (fields.category !== undefined) patch.category = fields.category;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(itemId, patch);
    }
  },
});

/**
 * Toggle the isIncluded boolean on a scope item.
 * Optimistic-update friendly (simple toggle).
 */
export const toggleItem = mutation({
  args: { itemId: v.id("scopeItems") },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");

    await verifyScopeOwnership(ctx, item.scopeId);

    await ctx.db.patch(itemId, {
      isIncluded: !item.isIncluded,
    });
  },
});

/**
 * Batch reorder items by accepting an array of {itemId, sortOrder}.
 * Auth + scope ownership required.
 */
export const reorderItems = mutation({
  args: {
    scopeId: v.id("scopes"),
    items: v.array(
      v.object({
        itemId: v.id("scopeItems"),
        sortOrder: v.number(),
      }),
    ),
  },
  handler: async (ctx, { scopeId, items }) => {
    await verifyScopeOwnership(ctx, scopeId);

    // Verify all items belong to this scope and update sortOrder
    for (const { itemId, sortOrder } of items) {
      const item = await ctx.db.get(itemId);
      if (!item) throw new Error(`Item ${itemId} not found`);
      if (item.scopeId !== scopeId) {
        throw new Error(`Item ${itemId} does not belong to this scope`);
      }

      await ctx.db.patch(itemId, { sortOrder });
    }
  },
});

/**
 * Delete a scope item (hard delete).
 * Auth + scope ownership required.
 */
export const removeItem = mutation({
  args: { itemId: v.id("scopeItems") },
  handler: async (ctx, { itemId }) => {
    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("Item not found");

    await verifyScopeOwnership(ctx, item.scopeId);

    await ctx.db.delete(itemId);
  },
});
