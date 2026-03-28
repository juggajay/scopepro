"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, AlertCircle, Building2, Paintbrush, Calendar, CheckCircle2 } from "lucide-react";
import { useScopeDownload } from "@/hooks/useScopeDownload";
import { prepareScopeData, type GroupedScopeItems } from "@/lib/scope-transform";
import type { ScopeDocumentProfile } from "@/lib/pdf/ScopeDocument";

// ── Types ────────────────────────────────────────────────────────────

/** Item shape from the public tracking query (confidence stripped). */
interface TrackingItem {
  _id: string;
  scopeId: string;
  category: string;
  description: string;
  quantity?: string;
  unit?: string;
  isIncluded: boolean;
  sortOrder: number;
}

interface TrackingScope {
  description?: string;
  propertyType?: string;
  scopeType?: "interior" | "exterior" | "both";
  createdAt: number;
}

interface TrackingProfile {
  businessName?: string;
  phone?: string;
  address?: string;
  abn?: string;
}

interface ScopeViewProps {
  scope: TrackingScope;
  items: TrackingItem[];
  profile?: TrackingProfile;
  recipientName?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
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

// ── Component ────────────────────────────────────────────────────────

export function ScopeView({
  scope,
  items,
  profile,
  recipientName,
}: ScopeViewProps) {
  const { downloadPdf, state, isDownloading } = useScopeDownload();

  // Group items by category (only included items — no confidence needed)
  // Add a fake confidence field for prepareScopeData compatibility
  const itemsWithConfidence = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        confidence: "high" as const,
      })),
    [items],
  );

  const groupedItems = useMemo(
    () => prepareScopeData(itemsWithConfidence, { includeAll: false }),
    [itemsWithConfidence],
  );

  const categories = Object.keys(groupedItems);
  const totalIncluded = items.filter((i) => i.isIncluded).length;

  // Build PDF-compatible profile
  const pdfProfile: ScopeDocumentProfile | undefined = profile
    ? {
        businessName: profile.businessName,
        phone: profile.phone,
        address: profile.address,
        abn: profile.abn,
      }
    : undefined;

  const handleDownload = () => {
    downloadPdf(scope, groupedItems, pdfProfile);
  };

  return (
    <div className="pb-24 sm:pb-8">
      {/* ── Business header ─────────────────────────────────────── */}
      {profile?.businessName && (
        <div className="mb-1 text-sm font-medium text-muted-foreground">
          {profile.businessName}
        </div>
      )}

      {/* ── Scope title ─────────────────────────────────────────── */}
      <h1 className="text-2xl font-semibold tracking-tight">
        {scope.description || "Scope of Works"}
      </h1>

      {/* ── Meta badges ─────────────────────────────────────────── */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
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

      {/* ── Summary ─────────────────────────────────────────────── */}
      <p className="mt-3 text-sm text-muted-foreground">
        {categories.length} {categories.length === 1 ? "category" : "categories"},{" "}
        {totalIncluded} {totalIncluded === 1 ? "item" : "items"}
      </p>

      {/* ── Desktop download button ─────────────────────────────── */}
      <div className="mt-6 hidden sm:block">
        <DownloadButton
          state={state}
          isDownloading={isDownloading}
          onClick={handleDownload}
        />
      </div>

      {/* ── Category sections ───────────────────────────────────── */}
      {categories.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-muted-foreground">
            No items in this scope.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {categories.map((category) => (
            <CategorySection
              key={category}
              category={category}
              items={groupedItems[category]}
            />
          ))}
        </div>
      )}

      {/* ── Contact info footer ─────────────────────────────────── */}
      {profile && (profile.phone || profile.address || profile.abn) && (
        <div className="mt-8 rounded-lg border border-border/50 bg-muted/30 p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contact
          </h2>
          <div className="space-y-1 text-sm text-foreground">
            {profile.businessName && (
              <p className="font-medium">{profile.businessName}</p>
            )}
            {profile.abn && (
              <p className="text-muted-foreground">ABN: {profile.abn}</p>
            )}
            {profile.phone && <p>{profile.phone}</p>}
            {profile.address && (
              <p className="text-muted-foreground">{profile.address}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile sticky download bar ──────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm sm:hidden">
        <div className="mx-auto max-w-3xl">
          <DownloadButton
            state={state}
            isDownloading={isDownloading}
            onClick={handleDownload}
            fullWidth
          />
        </div>
      </div>
    </div>
  );
}

// ── Category section (read-only) ─────────────────────────────────────

function CategorySection({
  category,
  items,
}: {
  category: string;
  items: GroupedScopeItems[string];
}) {
  return (
    <section
      className="rounded-lg border border-border/50 bg-card"
      aria-label={`${category} scope items`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
        <h2 className="text-sm font-semibold">{category}</h2>
        <span className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-border/20">
        {items.map((item) => (
          <div
            key={item._id}
            className="flex items-start gap-3 px-4 py-3"
            role="listitem"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-relaxed">{item.description}</p>
              {(item.quantity || item.unit) && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.quantity && <span>{item.quantity}</span>}
                  {item.quantity && item.unit && <span> </span>}
                  {item.unit && <span>{item.unit}</span>}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Download button ──────────────────────────────────────────────────

function DownloadButton({
  state,
  isDownloading,
  onClick,
  fullWidth = false,
}: {
  state: string;
  isDownloading: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  if (state === "error") {
    return (
      <Button
        variant="outline"
        onClick={onClick}
        className={`min-h-[44px] ${fullWidth ? "w-full" : ""}`}
      >
        <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
        Retry Download
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={isDownloading}
      className={`min-h-[44px] ${fullWidth ? "w-full" : ""}`}
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {state === "generating" ? "Generating PDF..." : "Downloading..."}
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  );
}
