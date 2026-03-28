import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Set a generation error on a scope and clear the generationStage.
 * Separated from ai.ts because Convex "use node" files can only export actions.
 */
export const setGenerationError = internalMutation({
  args: {
    scopeId: v.id("scopes"),
    error: v.string(),
  },
  handler: async (ctx, { scopeId, error }) => {
    const scope = await ctx.db.get(scopeId);
    if (!scope) return;

    const { _id, _creationTime, generationStage, ...rest } = scope;

    await ctx.db.replace(scopeId, {
      ...rest,
      generationError: error,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Save AI-generated scope items to the database.
 * Deletes any existing items for the scope first (idempotent).
 */
export const saveGeneratedItems = internalMutation({
  args: {
    scopeId: v.id("scopes"),
    items: v.array(
      v.object({
        category: v.string(),
        description: v.string(),
        quantity: v.optional(v.string()),
        unit: v.optional(v.string()),
        confidence: v.union(
          v.literal("high"),
          v.literal("medium"),
          v.literal("low"),
        ),
      }),
    ),
  },
  handler: async (ctx, { scopeId, items }) => {
    const existing = await ctx.db
      .query("scopeItems")
      .withIndex("by_scopeId", (q) => q.eq("scopeId", scopeId))
      .collect();

    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await ctx.db.insert("scopeItems", {
        scopeId,
        category: item.category,
        description: item.description,
        quantity: item.quantity ?? undefined,
        unit: item.unit ?? undefined,
        isIncluded: true,
        sortOrder: i + 1,
        confidence: item.confidence,
      });
    }
  },
});
