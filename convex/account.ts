import { v } from "convex/values";
import {
  query,
  mutation,
  action,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

// ── Queries ──────────────────────────────────────────────────────────

/**
 * Get the current user's business profile.
 * Returns defaults (empty fields) if no profile exists yet.
 */
export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (profile) return profile;

    // Return default values — the record is created on first save
    return {
      _id: null,
      userId,
      businessName: "",
      abn: "",
      licenseNumber: "",
      insuranceDetails: "",
      phone: "",
      address: "",
      state: "",
      logoStorageId: undefined,
      country: "AU" as const,
      createdAt: 0,
    };
  },
});

/**
 * Get the user's credit purchase history, newest first.
 */
export const getPurchaseHistory = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const purchases = await ctx.db
      .query("creditPurchases")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Sort by createdAt descending (newest first)
    purchases.sort((a, b) => b.createdAt - a.createdAt);

    return purchases;
  },
});

// ── Mutations ────────────────────────────────────────────────────────

/**
 * Create or update the user's business profile.
 * Validates ABN format if provided (must be 11 digits).
 */
export const updateProfile = mutation({
  args: {
    businessName: v.optional(v.string()),
    abn: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    insuranceDetails: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    state: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Validate ABN if provided: strip spaces and check for 11 digits
    if (args.abn !== undefined && args.abn !== "") {
      const stripped = args.abn.replace(/\s/g, "");
      if (!/^\d{11}$/.test(stripped)) {
        throw new Error("ABN must be exactly 11 digits");
      }
    }

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const fields = {
      businessName: args.businessName,
      abn: args.abn,
      licenseNumber: args.licenseNumber,
      insuranceDetails: args.insuranceDetails,
      phone: args.phone,
      address: args.address,
      state: args.state,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("profiles", {
        userId,
        ...fields,
        country: "AU",
        createdAt: Date.now(),
      });
    }
  },
});

// ── Delete account (cascade) ─────────────────────────────────────────

/**
 * Internal mutation: delete all data for a user.
 * Called by the deleteAccount action after auth user deletion.
 */
export const deleteAllUserDataInternal = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // 1. Delete all scope items for user's scopes
    const scopes = await ctx.db
      .query("scopes")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    for (const scope of scopes) {
      const items = await ctx.db
        .query("scopeItems")
        .withIndex("by_scopeId", (q) => q.eq("scopeId", scope._id))
        .collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }

      // Delete scope deliveries
      const deliveries = await ctx.db
        .query("scopeDeliveries")
        .withIndex("by_scopeId", (q) => q.eq("scopeId", scope._id))
        .collect();
      for (const delivery of deliveries) {
        await ctx.db.delete(delivery._id);
      }

      // Delete the scope itself
      await ctx.db.delete(scope._id);
    }

    // 2. Delete all credit purchases
    const purchases = await ctx.db
      .query("creditPurchases")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const purchase of purchases) {
      await ctx.db.delete(purchase._id);
    }

    // 3. Delete credits record
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (credits) {
      await ctx.db.delete(credits._id);
    }

    // 4. Delete profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (profile) {
      await ctx.db.delete(profile._id);
    }
  },
});

/**
 * Delete the user's account and all associated data.
 * This is an action so it can call both internal mutations and
 * handle the auth user deletion.
 */
export const deleteAccount = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Delete all user data via internal mutation
    await ctx.runMutation(internal.account.deleteAllUserDataInternal, {
      userId,
    });

    // Delete auth-related records (sessions, accounts, etc.)
    // The auth tables use userId references — delete them
    await ctx.runMutation(internal.account.deleteAuthTablesInternal, {
      userId,
    });
  },
});

/**
 * Internal mutation: delete auth-related records for a user.
 */
export const deleteAuthTablesInternal = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    // Delete auth sessions
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      // Delete refresh tokens for this session
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of tokens) {
        await ctx.db.delete(token._id);
      }
      await ctx.db.delete(session._id);
    }

    // Delete auth accounts and their verification codes
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of accounts) {
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of codes) {
        await ctx.db.delete(code._id);
      }
      await ctx.db.delete(account._id);
    }

    // Finally, delete the user record itself
    await ctx.db.delete(userId);
  },
});
