/**
 * Hook for downloading scope PDF.
 *
 * Manages download state (idle → generating → downloading → done/error).
 * Uses dynamic import for file-saver to keep it out of the initial bundle.
 */

"use client";

import { useState, useCallback } from "react";
import type { GroupedScopeItems } from "@/lib/scope-transform";
import type {
  ScopeDocumentData,
  ScopeDocumentProfile,
} from "@/lib/pdf/ScopeDocument";

type DownloadState = "idle" | "generating" | "downloading" | "error";

interface UseScopeDownloadReturn {
  downloadPdf: (
    scope: ScopeDocumentData & { description?: string },
    groupedItems: GroupedScopeItems,
    profile?: ScopeDocumentProfile,
  ) => Promise<void>;
  state: DownloadState;
  isDownloading: boolean;
  error: string | null;
}

export function useScopeDownload(): UseScopeDownloadReturn {
  const [state, setState] = useState<DownloadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const downloadPdf = useCallback(
    async (
      scope: ScopeDocumentData & { description?: string },
      groupedItems: GroupedScopeItems,
      profile?: ScopeDocumentProfile,
    ) => {
      try {
        setError(null);
        setState("generating");

        // Dynamic import to avoid SSR + keep bundle small
        const { generateScopePdf } = await import("@/lib/pdf/generate");
        const blob = await generateScopePdf(scope, groupedItems, profile);

        setState("downloading");

        // Dynamic import file-saver
        const { saveAs } = await import("file-saver");

        // Build a clean filename from the scope description
        const baseName = (scope.description || "scope")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 50);

        const dateStr = new Date().toISOString().slice(0, 10);
        const fileName = `${baseName}-${dateStr}.pdf`;

        saveAs(blob, fileName);
        setState("idle");
      } catch (err) {
        console.error("PDF download failed:", err);
        setError(
          err instanceof Error ? err.message : "Failed to generate PDF",
        );
        setState("error");
      }
    },
    [],
  );

  return {
    downloadPdf,
    state,
    isDownloading: state === "generating" || state === "downloading",
    error,
  };
}
