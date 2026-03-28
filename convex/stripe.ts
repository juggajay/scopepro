"use node";

import Stripe from "stripe";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const PACK_SIZES = [10, 25, 50] as const;
type PackSize = (typeof PACK_SIZES)[number];

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

function priceIdForPack(packSize: PackSize): string {
  const map: Record<PackSize, string | undefined> = {
    10: process.env.STRIPE_PRICE_10_PACK,
    25: process.env.STRIPE_PRICE_25_PACK,
    50: process.env.STRIPE_PRICE_50_PACK,
  };
  const priceId = map[packSize];
  if (!priceId) {
    throw new Error(`STRIPE_PRICE_${packSize}_PACK env var is not set`);
  }
  return priceId;
}

/**
 * Create a Stripe Checkout Session for purchasing a credit pack.
 * Returns the checkout session URL.
 */
export const createCheckoutSession = action({
  args: {
    packSize: v.union(v.literal(10), v.literal(25), v.literal(50)),
  },
  handler: async (ctx, { packSize }): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const stripe = getStripe();
    const priceId = priceIdForPack(packSize);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        packSize: String(packSize),
      },
      success_url: `${process.env.SITE_URL ?? "http://localhost:3000"}/account/credits?purchase=success`,
      cancel_url: `${process.env.SITE_URL ?? "http://localhost:3000"}/account/credits?purchase=cancelled`,
    });

    if (!session.url) {
      throw new Error("Failed to create Stripe checkout session");
    }

    return session.url;
  },
});
