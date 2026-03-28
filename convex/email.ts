"use node";

/**
 * Email delivery action — sends scope PDFs via Resend.
 *
 * "use node" is required because the Resend SDK uses Node.js APIs
 * (stream, crypto, buffer).
 */

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Resend } from "resend";

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";
const FROM_EMAIL = process.env.FROM_EMAIL ?? "ScopePro <noreply@scopepro.com.au>";

// ── Email HTML template ──────────────────────────────────────────────

function buildEmailHtml(opts: {
  recipientName?: string;
  description?: string;
  categoryCount: number;
  itemCount: number;
  trackingToken: string;
}): string {
  const { recipientName, description, categoryCount, itemCount, trackingToken } = opts;
  const viewUrl = `${SITE_URL}/s/${trackingToken}`;
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scope of Works</title>
</head>
<body style="margin:0;padding:0;background:#FAFAF9;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAFAF9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;border:1px solid #E7E5E4;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 32px 16px;border-bottom:2px solid #D4A574;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#B8864E;">ScopePro</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px;">
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#1C1917;">
                ${greeting}
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#1C1917;">
                Please find the scope of works attached to this email${description ? ` for <strong>${escapeHtml(description)}</strong>` : ""}.
              </p>

              <!-- Summary box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5EDE4;border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#78716C;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
                      Scope Summary
                    </p>
                    ${description ? `<p style="margin:0 0 4px;font-size:13px;color:#1C1917;"><strong>Description:</strong> ${escapeHtml(description)}</p>` : ""}
                    <p style="margin:0 0 4px;font-size:13px;color:#1C1917;"><strong>Categories:</strong> ${categoryCount}</p>
                    <p style="margin:0;font-size:13px;color:#1C1917;"><strong>Items:</strong> ${itemCount}</p>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td align="center" style="background:#D4A574;border-radius:6px;">
                    <a href="${viewUrl}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#FFFFFF;text-decoration:none;">
                      View Scope Online
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#78716C;text-align:center;">
                The PDF is also attached to this email for your records.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #E7E5E4;text-align:center;">
              <p style="margin:0;font-size:11px;color:#78716C;">
                Sent via <span style="color:#D4A574;font-weight:600;">ScopePro</span> &mdash; Professional scope of works, powered by AI.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Send email action ────────────────────────────────────────────────

export const sendScopeEmail = action({
  args: {
    scopeId: v.id("scopes"),
    recipientEmail: v.string(),
    recipientName: v.optional(v.string()),
    pdfStorageId: v.id("_storage"),
  },
  handler: async (ctx, { scopeId, recipientEmail, recipientName, pdfStorageId }) => {
    // 1. Auth check
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // 2. Fetch scope to verify ownership
    const scope = await ctx.runQuery(internal.emailMutations.getScopeForEmail, { scopeId, userId });
    if (!scope) throw new Error("Scope not found or access denied");

    // 3. Fetch scope items for summary
    const items = await ctx.runQuery(internal.emailMutations.getItemsForEmail, { scopeId });

    // Count categories and included items
    const includedItems = items.filter((i: any) => i.isIncluded);
    const categories = new Set(includedItems.map((i: any) => i.category));
    const categoryCount = categories.size;
    const itemCount = includedItems.length;

    // 4. Fetch PDF from Convex storage
    const pdfUrl = await ctx.storage.getUrl(pdfStorageId);
    if (!pdfUrl) throw new Error("PDF not found in storage");

    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) throw new Error("Failed to fetch PDF from storage");
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // 5. Generate tracking token
    const trackingToken = crypto.randomUUID();

    // 6. Build email HTML
    const html = buildEmailHtml({
      recipientName,
      description: scope.description,
      categoryCount,
      itemCount,
      trackingToken,
    });

    // Build filename for attachment
    const baseName = (scope.description || "scope")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `${baseName}-${dateStr}.pdf`;

    // 7. Send email via Resend
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: `Scope of Works${scope.description ? `: ${scope.description}` : ""}`,
      html,
      attachments: [
        {
          filename: fileName,
          content: pdfBuffer,
        },
      ],
    });

    if (error) {
      console.error("Resend email error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    // 8. Create scopeDelivery record
    const delivery = await ctx.runMutation(internal.emailMutations.createDelivery, {
      scopeId,
      recipientEmail,
      recipientName,
      trackingToken,
    });

    // 9. Update scope status to "sent" (forward transition only)
    try {
      await ctx.runMutation(internal.scopes.updateStatus, {
        scopeId,
        status: "sent",
      });
    } catch {
      // Status transition may fail if already "sent" or "viewed" — that's OK
    }

    return delivery;
  },
});

// Internal queries/mutations are in convex/emailMutations.ts
// (Convex requires "use node" files to only export actions).
