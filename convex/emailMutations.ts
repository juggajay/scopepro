import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

/**
 * Internal queries/mutations for the email action.
 * Separated from email.ts because Convex "use node" files can only export actions.
 */

export const getScopeForEmail = internalQuery({
  args: {
    scopeId: v.id("scopes"),
    userId: v.id("users"),
  },
  handler: async (ctx, { scopeId, userId }) => {
    const scope = await ctx.db.get(scopeId);
    if (!scope) return null;
    if (scope.userId !== userId) return null;
    if (scope.deletedAt !== undefined) return null;
    return scope;
  },
});

export const getItemsForEmail = internalQuery({
  args: { scopeId: v.id("scopes") },
  handler: async (ctx, { scopeId }) => {
    return await ctx.db
      .query("scopeItems")
      .withIndex("by_scopeId", (q) => q.eq("scopeId", scopeId))
      .collect();
  },
});

export const createDelivery = internalMutation({
  args: {
    scopeId: v.id("scopes"),
    recipientEmail: v.string(),
    recipientName: v.optional(v.string()),
    trackingToken: v.string(),
  },
  handler: async (ctx, { scopeId, recipientEmail, recipientName, trackingToken }) => {
    const id = await ctx.db.insert("scopeDeliveries", {
      scopeId,
      recipientEmail,
      recipientName,
      sentAt: Date.now(),
      trackingToken,
    });

    return { id, trackingToken };
  },
});
