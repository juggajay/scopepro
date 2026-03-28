"use client";

/**
 * PDF download button for scope documents.
 *
 * Shows a spinner while generating, error state with retry.
 */

import { Button } from "@/components/ui/button";
import { FileDown, Loader2, AlertCircle } from "lucide-react";
import { useScopeDownload } from "@/hooks/useScopeDownload";
import { prepareScopeData, type ScopeItem } from "@/lib/scope-transform";
import type {
  ScopeDocumentData,
  ScopeDocumentProfile,
} from "@/lib/pdf/ScopeDocument";
import { useMemo } from "react";

interface PdfDownloadProps {
  scope: ScopeDocumentData & { description?: string };
  items: ScopeItem[];
  profile?: ScopeDocumentProfile;
  /** Compact mode for mobile bar */
  compact?: boolean;
}

export function PdfDownload({
  scope,
  items,
  profile,
  compact = false,
}: PdfDownloadProps) {
  const { downloadPdf, state, isDownloading, error } = useScopeDownload();

  // Only include items that are toggled on for the PDF
  const groupedItems = useMemo(
    () => prepareScopeData(items, { includeAll: false }),
    [items],
  );

  const handleClick = () => {
    downloadPdf(scope, groupedItems, profile);
  };

  if (state === "error") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        className={compact ? "min-h-[44px]" : ""}
      >
        <AlertCircle className="mr-1.5 h-4 w-4 text-destructive" />
        {compact ? "Retry" : "Retry PDF"}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isDownloading}
      className={compact ? "min-h-[44px]" : ""}
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          {compact
            ? "PDF..."
            : state === "generating"
              ? "Generating PDF..."
              : "Downloading..."}
        </>
      ) : (
        <>
          <FileDown className="mr-1.5 h-4 w-4" />
          {compact ? "PDF" : "Download PDF"}
        </>
      )}
    </Button>
  );
}
