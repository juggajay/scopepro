import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  // Business profile (separate from auth users)
  profiles: defineTable({
    userId: v.id("users"),
    businessName: v.optional(v.string()),
    abn: v.optional(v.string()),
    licenseNumber: v.optional(v.string()),
    insuranceDetails: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.literal("AU")),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  // Credit balance per user
  credits: defineTable({
    userId: v.id("users"),
    balance: v.number(),
    totalPurchased: v.number(),
    totalUsed: v.number(),
  }).index("by_userId", ["userId"]),

  // Purchase history (Stripe sessions)
  creditPurchases: defineTable({
    userId: v.id("users"),
    packSize: v.number(),
    amount: v.number(),
    stripeSessionId: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_stripeSessionId", ["stripeSessionId"]),

  // Scope records
  scopes: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("draft"),
      v.literal("generated"),
      v.literal("sent"),
      v.literal("viewed")
    ),
    generationStage: v.optional(
      v.union(
        v.literal("analyzing"),
        v.literal("generating"),
        v.literal("validating")
      )
    ),
    generationError: v.optional(v.string()),
    photos: v.array(v.id("_storage")),
    description: v.optional(v.string()),
    propertyType: v.optional(v.string()),
    scopeType: v.optional(
      v.union(
        v.literal("interior"),
        v.literal("exterior"),
        v.literal("both")
      )
    ),
    surfaceTypes: v.optional(v.array(v.string())),
    specialRequirements: v.optional(v.string()),
    deletedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"])
    .index("by_userId_deletedAt", ["userId", "deletedAt"]),

  // Individual scope line items
  scopeItems: defineTable({
    scopeId: v.id("scopes"),
    category: v.string(),
    description: v.string(),
    quantity: v.optional(v.string()),
    unit: v.optional(v.string()),
    isIncluded: v.boolean(),
    sortOrder: v.number(),
    confidence: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
  }).index("by_scopeId", ["scopeId"]),

  // Email deliveries with tracking tokens
  scopeDeliveries: defineTable({
    scopeId: v.id("scopes"),
    recipientEmail: v.string(),
    recipientName: v.optional(v.string()),
    sentAt: v.number(),
    viewedAt: v.optional(v.number()),
    trackingToken: v.string(),
  })
    .index("by_scopeId", ["scopeId"])
    .index("by_trackingToken", ["trackingToken"]),
});
