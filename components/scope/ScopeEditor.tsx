"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { prepareScopeData, type ScopeItem } from "@/lib/scope-transform";
import { ScopeItemGroup } from "./ScopeItemGroup";
import { PdfDownload } from "./PdfDownload";
import { EmailDialog } from "./EmailDialog";
import { Badge } from "@/components/ui/badge";
import {
  Coins,
  Calendar,
  Building2,
  Paintbrush,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function scopeTypeLabel(type?: string): string {
  switch (type) {
    case "interior":
      return "Interior";
    case "exterior":
      return "Exterior";
    case "both":
      return "Interior & Exterior";
    default:
      return "Not specified";
  }
}

// ── Desktop media query hook ──────────────────────────────────────────

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDesktop;
}

// ── Types ─────────────────────────────────────────────────────────────

interface ScopeEditorProps {
  scope: {
    _id: Id<"scopes">;
    description?: string;
    propertyType?: string;
    scopeType?: "interior" | "exterior" | "both";
    createdAt: number;
  };
  items: ScopeItem[];
}

// ── Component ─────────────────────────────────────────────────────────

export function ScopeEditor({ scope, items }: ScopeEditorProps) {
  // Group items by category (includeAll: show excluded items dimmed)
  const groupedItems = useMemo(
    () => prepareScopeData(items, { includeAll: true }),
    [items],
  );

  const categories = Object.keys(groupedItems);

  // Credit balance
  const creditBalance = useQuery(api.credits.getBalance);

  // Desktop detection for default expand state
  const isDesktop = useIsDesktop();

  // Item summary counts
  const totalItems = items.length;
  const includedItems = items.filter((i) => i.isIncluded).length;

  return (
    <div className="pb-28 sm:pb-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-6 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {scope.description || "Untitled Scope"}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          {scope.propertyType && (
            <Badge variant="secondary">
              <Building2 className="mr-1 h-3 w-3" />
              {scope.propertyType}
            </Badge>
          )}
          <Badge variant="secondary">
            <Paintbrush className="mr-1 h-3 w-3" />
            {scopeTypeLabel(scope.scopeType)}
          </Badge>
          <Badge variant="outline">
            <Calendar className="mr-1 h-3 w-3" />
            {formatDate(scope.createdAt)}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          {includedItems} of {totalItems} items included
        </p>
      </div>

      {/* ── Desktop action bar ──────────────────────────────── */}
      <div className="mb-6 hidden items-center justify-between sm:flex">
        {/* Credit balance */}
        {creditBalance && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Coins className="h-4 w-4" />
            <span>
              {creditBalance.balance} credit{creditBalance.balance !== 1 ? "s" : ""} remaining
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <PdfDownload scope={scope} items={items} />
          <EmailDialog scopeId={scope._id} scope={scope} items={items} />
        </div>
      </div>

      {/* ── Category groups ─────────────────────────────────── */}
      {categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-muted-foreground">
            No scope items yet. Items will appear here after generation.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <ScopeItemGroup
              key={category}
              category={category}
              items={groupedItems[category]}
              scopeId={scope._id}
              defaultExpanded={isDesktop}
            />
          ))}
        </div>
      )}

      {/* ── Mobile sticky action bar ────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm sm:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          {/* Credit balance (compact) */}
          {creditBalance && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Coins className="h-3.5 w-3.5" />
              <span>{creditBalance.balance}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <PdfDownload scope={scope} items={items} compact />
            <EmailDialog
              scopeId={scope._id}
              scope={scope}
              items={items}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}
