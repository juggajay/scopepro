"use client";

import { use, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ScopeView } from "@/components/tracking/ScopeView";
import { FileWarning, AlertCircle } from "lucide-react";

export default function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  // Fetch scope data (public — no auth needed)
  const data = useQuery(api.tracking.getScopeByToken, { token });
  const recordView = useMutation(api.tracking.recordView);

  // Record view on mount (once)
  const hasRecordedView = useRef(false);
  useEffect(() => {
    if (hasRecordedView.current) return;
    if (data === undefined) return; // Still loading
    if (data === null) return; // Invalid token
    if (data.deleted) return; // Deleted scope

    hasRecordedView.current = true;
    recordView({ token }).catch(() => {
      // Silently fail — view tracking is best-effort
    });
  }, [data, token, recordView]);

  // ── Loading state ──────────────────────────────────────────────────

  if (data === undefined) {
    return <TrackingSkeleton />;
  }

  // ── Invalid token ──────────────────────────────────────────────────

  if (data === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <AlertCircle className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">Scope not found</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This link may be invalid or expired. Please contact the sender for an
          updated link.
        </p>
      </div>
    );
  }

  // ── Deleted scope ──────────────────────────────────────────────────

  if (data.deleted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileWarning className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-semibold">This scope is no longer available</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          The scope of works has been removed by the sender. Please contact them
          if you need an updated version.
        </p>
      </div>
    );
  }

  // ── Valid scope ────────────────────────────────────────────────────

  return (
    <ScopeView
      scope={data.scope}
      items={data.items}
      profile={data.profile}
      recipientName={data.delivery.recipientName}
    />
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────

function TrackingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="h-8 w-72 rounded bg-muted" />
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="h-6 w-24 rounded-full bg-muted" />
          <div className="h-6 w-28 rounded-full bg-muted" />
        </div>
      </div>

      {/* Category skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border/50 p-4 space-y-3">
          <div className="h-5 w-36 rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-4/5 rounded bg-muted" />
            <div className="h-4 w-3/5 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
