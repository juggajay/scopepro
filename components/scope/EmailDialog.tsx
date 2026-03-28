"use client";

/**
 * Email send dialog for scope documents.
 *
 * Flow:
 * 1. User fills in recipient email + name
 * 2. On submit: generate PDF client-side → upload to Convex storage → call sendScopeEmail
 * 3. Show success or error state
 */

import { useState, useMemo } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { prepareScopeData, type ScopeItem } from "@/lib/scope-transform";
import type {
  ScopeDocumentData,
  ScopeDocumentProfile,
} from "@/lib/pdf/ScopeDocument";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────

type SendState = "idle" | "generating" | "uploading" | "sending" | "success" | "error";

interface EmailDialogProps {
  scopeId: Id<"scopes">;
  scope: ScopeDocumentData & { description?: string };
  items: ScopeItem[];
  profile?: ScopeDocumentProfile;
  /** Compact mode for mobile bar */
  compact?: boolean;
}

// ── Component ────────────────────────────────────────────────────────

export function EmailDialog({
  scopeId,
  scope,
  items,
  profile,
  compact = false,
}: EmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.scopes.generateUploadUrl);
  const sendScopeEmail = useAction(api.email.sendScopeEmail);

  // Only include toggled-on items for the PDF
  const groupedItems = useMemo(
    () => prepareScopeData(items, { includeAll: false }),
    [items],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    try {
      setError(null);

      // Step 1: Generate PDF client-side
      setSendState("generating");
      const { generateScopePdf } = await import("@/lib/pdf/generate");
      const pdfBlob = await generateScopePdf(scope, groupedItems, profile);

      // Step 2: Upload PDF to Convex storage
      setSendState("uploading");
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: pdfBlob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload PDF");
      }

      const { storageId } = await uploadResponse.json();

      // Step 3: Send email via Convex action
      setSendState("sending");
      await sendScopeEmail({
        scopeId,
        recipientEmail: email.trim(),
        recipientName: name.trim() || undefined,
        pdfStorageId: storageId as Id<"_storage">,
      });

      // Success!
      setSendState("success");
    } catch (err) {
      console.error("Email send failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to send email",
      );
      setSendState("error");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // Reset state when dialog closes
    if (!newOpen) {
      // Small delay so animation plays before reset
      setTimeout(() => {
        setSendState("idle");
        setError(null);
      }, 200);
    }
  };

  const isBusy =
    sendState === "generating" ||
    sendState === "uploading" ||
    sendState === "sending";

  const statusMessage: Record<string, string> = {
    generating: "Generating PDF...",
    uploading: "Uploading PDF...",
    sending: "Sending email...",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button size="sm" className={compact ? "min-h-[44px]" : ""} />
        }
      >
        <Mail className="mr-1.5 h-4 w-4" />
        {compact ? "Email" : "Send Email"}
      </DialogTrigger>

      <DialogContent>
        {sendState === "success" ? (
          // ── Success state ──────────────────────────
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-center text-sm font-medium">
              Scope sent to {name.trim() || email.trim()}!
            </p>
            <p className="text-center text-xs text-muted-foreground">
              They&apos;ll receive the scope PDF by email.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              className="mt-2"
            >
              Done
            </Button>
          </div>
        ) : (
          // ── Form state ────────────────────────────
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Send Scope via Email</DialogTitle>
              <DialogDescription>
                The recipient will receive a branded email with your scope of
                works PDF attached.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-recipient">Email address *</Label>
                <Input
                  id="email-recipient"
                  type="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                  disabled={isBusy}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-name">Recipient name (optional)</Label>
                <Input
                  id="email-name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setName(e.target.value)
                  }
                  disabled={isBusy}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="submit"
                disabled={isBusy || !email.trim()}
                size="sm"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    {statusMessage[sendState] || "Sending..."}
                  </>
                ) : sendState === "error" ? (
                  <>
                    <Mail className="mr-1.5 h-4 w-4" />
                    Retry
                  </>
                ) : (
                  <>
                    <Mail className="mr-1.5 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
