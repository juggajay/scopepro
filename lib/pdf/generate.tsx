/**
 * PDF blob generation.
 *
 * MUST use dynamic import for @react-pdf/renderer — it breaks SSR
 * (~500KB bundle, uses browser-only APIs). Dynamic import ensures it's
 * only loaded client-side when actually needed.
 */

import type { GroupedScopeItems } from "@/lib/scope-transform";
import type {
  ScopeDocumentData,
  ScopeDocumentProfile,
} from "./ScopeDocument";

/**
 * Generate a PDF blob from scope data.
 *
 * Dynamically imports @react-pdf/renderer and the ScopeDocument template
 * to avoid SSR crashes.
 */
export async function generateScopePdf(
  scope: ScopeDocumentData,
  groupedItems: GroupedScopeItems,
  profile?: ScopeDocumentProfile,
): Promise<Blob> {
  // Dynamic imports to avoid SSR crashes
  const [{ pdf }, { ScopeDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./ScopeDocument"),
  ]);

  const document = ScopeDocument({ scope, groupedItems, profile });
  const blob = await pdf(document).toBlob();

  return blob;
}
