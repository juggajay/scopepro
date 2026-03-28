import { v } from "convex/values";
import {
  query,
  mutation,
  internalMutation,
  type MutationCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

// Rate limiter: 10 credit deductions per minute per user
const rateLimiter = new RateLimiter(components.rateLimiter, {
  creditDeduction: {
    kind: "token bucket",
    rate: 10,
    period: MINUTE,
    capacity: 10,
  },
});

/**
 * Get the current user's credit balance.
 * If no credit record exists, returns defaults (3 free credits).
 * The actual record is created lazily on first mutation.
 */
export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      return {
        balance: existing.balance,
        totalPurchased: existing.totalPurchased,
        totalUsed: existing.totalUsed,
      };
    }

    // Return default values for new users — the record will be created
    // on first mutation (deductCredit or addCredits). Queries cannot write.
    return {
      balance: 3,
      totalPurchased: 0,
      totalUsed: 0,
    };
  },
});

/**
 * Ensure a credits record exists for the user, creating one with 3 free
 * credits if needed. Returns the document.
 */
async function ensureCreditsRecord(ctx: MutationCtx, userId: Id<"users">) {
  const existing = await ctx.db
    .query("credits")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (existing) return existing;

  const id = await ctx.db.insert("credits", {
    userId,
    balance: 3,
    totalPurchased: 0,
    totalUsed: 0,
  });

  return (await ctx.db.get(id))!;
}

/**
 * Deduct 1 credit from the user's balance.
 * Allows overdraft down to -2 (checks balance > -2 before deducting).
 * Rate-limited to 10 per minute per user.
 */
export const deductCredit = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Rate limit
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "creditDeduction", {
      key: userId,
    });
    if (!ok) {
      throw new Error(
        `Rate limited. Try again in ${Math.ceil((retryAfter ?? 0) / 1000)}s.`,
      );
    }

    const record = await ensureCreditsRecord(ctx, userId);

    // Allow overdraft to -2: balance must be > -2 before deduction
    // (so after deduction it will be >= -2)
    if (record.balance <= -2) {
      throw new Error("Insufficient credits. Please purchase more credits.");
    }

    await ctx.db.patch(record._id, {
      balance: record.balance - 1,
      totalUsed: record.totalUsed + 1,
    });

    return { balance: record.balance - 1 };
  },
});

/**
 * Refund 1 credit to the user's balance.
 * Used when AI generation fails.
 */
export const refundCredit = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const record = await ensureCreditsRecord(ctx, userId);

    await ctx.db.patch(record._id, {
      balance: record.balance + 1,
      totalUsed: Math.max(0, record.totalUsed - 1),
    });

    return { balance: record.balance + 1 };
  },
});

/**
 * Add credits after a Stripe purchase (internal only).
 * Idempotent: checks stripeSessionId has not already been processed.
 */
export const addCredits = internalMutation({
  args: {
    userId: v.id("users"),
    packSize: v.number(),
    amount: v.number(),
    stripeSessionId: v.string(),
  },
  handler: async (ctx, { userId, packSize, amount, stripeSessionId }) => {
    // Idempotency: check if this Stripe session has already been processed
    const existingPurchase = await ctx.db
      .query("creditPurchases")
      .withIndex("by_stripeSessionId", (q) =>
        q.eq("stripeSessionId", stripeSessionId),
      )
      .unique();

    if (existingPurchase) {
      // Already processed — silently succeed
      return;
    }

    // Ensure credits record exists
    const record = await ensureCreditsRecord(ctx, userId);

    // Add credits
    await ctx.db.patch(record._id, {
      balance: record.balance + packSize,
      totalPurchased: record.totalPurchased + packSize,
    });

    // Record the purchase
    await ctx.db.insert("creditPurchases", {
      userId,
      packSize,
      amount,
      stripeSessionId,
      createdAt: Date.now(),
    });
  },
});
