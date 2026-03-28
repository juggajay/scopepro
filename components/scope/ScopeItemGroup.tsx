"use client";

import { useState, useEffect } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import type { ScopeItem } from "@/lib/scope-transform";
import { ScopeItemRow } from "./ScopeItemRow";
import { AddItemButton } from "./AddItemButton";
import { ChevronDown } from "lucide-react";

interface ScopeItemGroupProps {
  category: string;
  items: ScopeItem[];
  scopeId: Id<"scopes">;
  /** Whether the group starts expanded. Desktop: true, Mobile: false. */
  defaultExpanded: boolean;
}

/**
 * Collapsible section for a single category of scope items.
 * Shows the category name, item count, and included count in the header.
 */
export function ScopeItemGroup({
  category,
  items,
  scopeId,
  defaultExpanded,
}: ScopeItemGroupProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Re-sync if defaultExpanded changes (e.g., viewport resize)
  useEffect(() => {
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const includedCount = items.filter((item) => item.isIncluded).length;
  const totalCount = items.length;

  return (
    <section
      className="rounded-lg border border-border bg-card"
      aria-label={`${category} scope items`}
    >
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50"
        aria-expanded={isExpanded}
        aria-controls={`group-${category}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
              isExpanded ? "" : "-rotate-90"
            }`}
          />
          <h2 className="text-sm font-semibold truncate">{category}</h2>
        </div>

        <span className="shrink-0 text-xs text-muted-foreground">
          {includedCount}/{totalCount} included
        </span>
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div
          id={`group-${category}`}
          role="list"
          aria-label={`${category} items`}
          className="space-y-2 px-4 pb-4"
        >
          {items.map((item) => (
            <ScopeItemRow key={item._id} item={item} />
          ))}

          <AddItemButton scopeId={scopeId} category={category} />
        </div>
      )}
    </section>
  );
}
