import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── Status transition order (high-water mark — never goes backwards) ──
const STATUS_ORDER = ["draft", "generated", "sent", "viewed"] as const;
type ScopeStatus = (typeof STATUS_ORDER)[number];

function isForwardTransition(
  current: ScopeStatus,
  next: ScopeStatus,
): boolean {
  return STATUS_ORDER.indexOf(next) > STATUS_ORDER.indexOf(current);
}

// ── Public queries (NO auth required) ───────────────────────────────

/**
 * Look up a scope by its tracking token (from an email delivery link).
 * Returns scope data + items with confidence stripped.
 * Public — no auth required.
 */
export const getScopeByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // 1. Find the delivery record by tracking token
    const delivery = await ctx.db
      .query("scopeDeliveries")
      .withIndex("by_trackingToken", (q) => q.eq("trackingToken", token))
      .unique();

    if (!delivery) return null;

    // 2. Fetch the scope
    const scope = await ctx.db.get(delivery.scopeId);
    if (!scope) return null;

    // 3. If the scope has been soft-deleted, indicate that
    if (scope.deletedAt !== undefined) {
      return { deleted: true as const };
    }

    // 4. Fetch the owner's profile for business branding
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", scope.userId))
      .unique();

    // 5. Fetch all scope items
    const items = await ctx.db
      .query("scopeItems")
      .withIndex("by_scopeId", (q) => q.eq("scopeId", delivery.scopeId))
      .collect();

    // Sort by sortOrder ascending
    items.sort((a, b) => a.sortOrder - b.sortOrder);

    // 6. Strip confidence indicators and internal IDs from items
    const safeItems = items.map((item) => ({
      _id: item._id as string,
      scopeId: item.scopeId as string,
      category: item.category,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      isIncluded: item.isIncluded,
      sortOrder: item.sortOrder,
    }));

    // 7. Return safe scope data (no userId, no internal details)
    return {
      deleted: false as const,
      scope: {
        description: scope.description,
        propertyType: scope.propertyType,
        scopeType: scope.scopeType,
        createdAt: scope.createdAt,
      },
      items: safeItems,
      profile: profile
        ? {
            businessName: profile.businessName,
            phone: profile.phone,
            address: profile.address,
            abn: profile.abn,
          }
        : undefined,
      delivery: {
        recipientName: delivery.recipientName,
        sentAt: delivery.sentAt,
      },
    };
  },
});

// ── Public mutations (NO auth required) ──────────────────────────────

/**
 * Record that a recipient viewed the scope.
 * Sets viewedAt on the delivery (if not already set) and advances
 * the scope status to "viewed" (forward transition only).
 * Public — no auth required.
 */
export const recordView = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    // 1. Find the delivery record
    const delivery = await ctx.db
      .query("scopeDeliveries")
      .withIndex("by_trackingToken", (q) => q.eq("trackingToken", token))
      .unique();

    if (!delivery) return;

    // 2. Set viewedAt if not already set (first view wins)
    if (delivery.viewedAt === undefined) {
      await ctx.db.patch(delivery._id, {
        viewedAt: Date.now(),
      });
    }

    // 3. Advance scope status to "viewed" (forward-only)
    const scope = await ctx.db.get(delivery.scopeId);
    if (!scope) return;
    if (scope.deletedAt !== undefined) return;

    if (isForwardTransition(scope.status as ScopeStatus, "viewed")) {
      await ctx.db.patch(scope._id, {
        status: "viewed",
        updatedAt: Date.now(),
      });
    }
  },
});
