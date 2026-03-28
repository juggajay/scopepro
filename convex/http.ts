import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// ── Auth routes ──────────────────────────────────────────────────────
auth.addHttpRoutes(http);

// ── Stripe signature verification (Web Crypto — no Node.js needed) ──

/**
 * Verify a Stripe webhook signature using the Web Crypto API.
 * Stripe signs the payload as: HMAC-SHA256(`${timestamp}.${payload}`, secret)
 * The `stripe-signature` header has format: `t=<timestamp>,v1=<hex_signature>`
 */
async function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  // Parse the header: t=timestamp,v1=signature
  const parts = signatureHeader.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const signaturePart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !signaturePart) return false;

  const timestamp = timestampPart.slice(2);
  const expectedSig = signaturePart.slice(3);

  // Reject events older than 5 minutes (300 seconds) to prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp, 10)) > 300) return false;

  // Compute HMAC-SHA256 of `${timestamp}.${payload}` using the webhook secret
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signedPayload = encoder.encode(`${timestamp}.${payload}`);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, signedPayload);

  // Convert to hex string
  const computedSig = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (computedSig.length !== expectedSig.length) return false;

  // Use subtle.verify for constant-time comparison by re-importing the
  // computed signature as a key and verifying against it — or simply
  // compare byte-by-byte with timing-safe approach
  let mismatch = 0;
  for (let i = 0; i < computedSig.length; i++) {
    mismatch |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Stripe webhook ───────────────────────────────────────────────────
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return new Response("Server configuration error", { status: 500 });
    }

    // Read raw body and signature header
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    // Verify webhook signature using Web Crypto
    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error("Stripe webhook signature verification failed");
      return new Response("Invalid signature", { status: 400 });
    }

    // Parse the event
    let event: {
      type: string;
      data: {
        object: {
          id: string;
          metadata?: Record<string, string>;
          amount_total?: number;
        };
      };
    };

    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      const userId = session.metadata?.userId;
      const packSizeStr = session.metadata?.packSize;
      const stripeSessionId = session.id;

      if (!userId || !packSizeStr) {
        console.error("Missing metadata in Stripe session:", stripeSessionId);
        return new Response("Missing metadata", { status: 400 });
      }

      const packSize = parseInt(packSizeStr, 10);
      if (![10, 25, 50].includes(packSize)) {
        console.error("Invalid packSize in metadata:", packSizeStr);
        return new Response("Invalid packSize", { status: 400 });
      }

      // Amount in cents from Stripe
      const amount = session.amount_total ?? 0;

      // Call internal mutation to add credits (idempotent)
      await ctx.runMutation(internal.credits.addCredits, {
        userId: userId as any,
        packSize,
        amount,
        stripeSessionId,
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
