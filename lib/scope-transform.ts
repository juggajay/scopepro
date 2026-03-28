/**
 * Shared data transform for scope items.
 * Used by both the scope editor UI and PDF generation.
 */

export interface ScopeItem {
  _id: string;
  scopeId: string;
  category: string;
  description: string;
  quantity?: string;
  unit?: string;
  isIncluded: boolean;
  sortOrder: number;
  confidence: "high" | "medium" | "low";
}

export interface GroupedScopeItems {
  [category: string]: ScopeItem[];
}

interface PrepareScopeDataOptions {
  /** Include all items regardless of isIncluded. Default: false (only included items). */
  includeAll?: boolean;
}

/**
 * Takes a flat array of scope items and returns them grouped by category.
 *
 * - Items grouped by category (object with category keys)
 * - Within each category, sorted by sortOrder ascending
 * - Only included items (isIncluded === true) by default
 * - Category names sorted alphabetically (object key order)
 */
export function prepareScopeData(
  items: ScopeItem[],
  options: PrepareScopeDataOptions = {},
): GroupedScopeItems {
  const { includeAll = false } = options;

  // Filter to included items only (unless includeAll is true)
  const filtered = includeAll ? items : items.filter((item) => item.isIncluded);

  // Group by category
  const grouped: GroupedScopeItems = {};
  for (const item of filtered) {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  }

  // Sort items within each category by sortOrder
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Return with categories sorted alphabetically
  const sortedCategories = Object.keys(grouped).sort();
  const result: GroupedScopeItems = {};
  for (const category of sortedCategories) {
    result[category] = grouped[category];
  }

  return result;
}
