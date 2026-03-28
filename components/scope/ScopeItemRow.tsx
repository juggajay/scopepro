"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Check } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

interface ScopeItemRowProps {
  item: {
    _id: string;
    scopeId: string;
    category: string;
    description: string;
    quantity?: string;
    unit?: string;
    isIncluded: boolean;
    sortOrder: number;
    confidence: "high" | "medium" | "low";
  };
}

// ── Confidence indicator config ───────────────────────────────────────

const CONFIDENCE_CONFIG = {
  high: {
    tooltip: "High confidence",
    ariaLabel: "High confidence item",
    shape: "filled-circle" as const,
    colorClasses: "bg-success text-success",
  },
  medium: {
    tooltip: "Verify this",
    ariaLabel: "Medium confidence — verify this item",
    shape: "half-circle" as const,
    colorClasses: "text-warning",
  },
  low: {
    tooltip: "AI guessing",
    ariaLabel: "Low confidence — AI guessing",
    shape: "outline-circle" as const,
    colorClasses: "text-destructive",
  },
} as const;

function ConfidenceIndicator({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const config = CONFIDENCE_CONFIG[confidence];

  const indicator = (
    <span
      className="inline-flex shrink-0 items-center gap-1"
      aria-label={config.ariaLabel}
      role="img"
    >
      {confidence === "high" && (
        <span className="block h-3 w-3 rounded-full bg-success" />
      )}
      {confidence === "medium" && (
        <span className="relative block h-3 w-3 overflow-hidden rounded-full border-2 border-warning">
          <span className="absolute inset-y-0 left-0 w-1/2 bg-warning" />
        </span>
      )}
      {confidence === "low" && (
        <>
          <span className="block h-3 w-3 rounded-full border-2 border-destructive" />
          <span className="text-[11px] font-medium text-destructive">AI guessing</span>
        </>
      )}
    </span>
  );

  // Low confidence has a visible label, so no tooltip needed
  if (confidence === "low") return indicator;

  return (
    <Tooltip>
      <TooltipTrigger className="cursor-default">{indicator}</TooltipTrigger>
      <TooltipContent>{config.tooltip}</TooltipContent>
    </Tooltip>
  );
}

// ── Inline editable field ─────────────────────────────────────────────

function InlineEdit({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = "",
  inputClassName = "",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  inputClassName?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync from parent when not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  const handleStartEdit = () => {
    setIsEditing(true);
    // Wait for render then focus
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`min-h-[44px] rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 ${inputClassName}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      onFocus={handleStartEdit}
      className={`min-h-[44px] cursor-text rounded-md px-2 py-1 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${className}`}
      aria-label={`Edit ${ariaLabel}`}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </button>
  );
}

// ── Main item row ─────────────────────────────────────────────────────

export function ScopeItemRow({ item }: ScopeItemRowProps) {
  const itemId = item._id as Id<"scopeItems">;

  const updateItem = useMutation(api.scopeItems.updateItem);
  const toggleItem = useMutation(api.scopeItems.toggleItem);
  const removeItem = useMutation(api.scopeItems.removeItem);

  // ── Local state for inline editing with debounced save ──

  const [localDescription, setLocalDescription] = useState(item.description);
  const [localQuantity, setLocalQuantity] = useState(item.quantity ?? "");
  const [localUnit, setLocalUnit] = useState(item.unit ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isDeleting, setIsDeleting] = useState(false);

  // Track if optimistic toggle is in flight
  const [optimisticIncluded, setOptimisticIncluded] = useState(item.isIncluded);

  // Sync from server
  useEffect(() => {
    setOptimisticIncluded(item.isIncluded);
  }, [item.isIncluded]);

  useEffect(() => {
    setLocalDescription(item.description);
  }, [item.description]);

  useEffect(() => {
    setLocalQuantity(item.quantity ?? "");
  }, [item.quantity]);

  useEffect(() => {
    setLocalUnit(item.unit ?? "");
  }, [item.unit]);

  // Debounced values
  const debouncedDescription = useDebounce(localDescription, 500);
  const debouncedQuantity = useDebounce(localQuantity, 500);
  const debouncedUnit = useDebounce(localUnit, 500);

  // Track "original" values to detect changes
  const serverValues = useRef({
    description: item.description,
    quantity: item.quantity ?? "",
    unit: item.unit ?? "",
  });

  useEffect(() => {
    serverValues.current = {
      description: item.description,
      quantity: item.quantity ?? "",
      unit: item.unit ?? "",
    };
  }, [item.description, item.quantity, item.unit]);

  // Auto-save on debounced changes
  useEffect(() => {
    const changes: Record<string, string> = {};

    if (debouncedDescription !== serverValues.current.description) {
      changes.description = debouncedDescription;
    }
    if (debouncedQuantity !== serverValues.current.quantity) {
      changes.quantity = debouncedQuantity;
    }
    if (debouncedUnit !== serverValues.current.unit) {
      changes.unit = debouncedUnit;
    }

    if (Object.keys(changes).length === 0) return;

    setSaveStatus("saving");
    updateItem({ itemId, ...changes })
      .then(() => {
        setSaveStatus("saved");
        // Update server ref so we don't re-save
        Object.assign(serverValues.current, changes);
      })
      .catch(() => {
        setSaveStatus("idle");
      });
  }, [debouncedDescription, debouncedQuantity, debouncedUnit, itemId, updateItem]);

  // Clear "Saved" indicator after 1.5s
  useEffect(() => {
    if (saveStatus !== "saved") return;
    const timer = setTimeout(() => setSaveStatus("idle"), 1500);
    return () => clearTimeout(timer);
  }, [saveStatus]);

  // ── Toggle handler (optimistic) ──

  const handleToggle = useCallback(() => {
    setOptimisticIncluded((prev) => !prev);
    toggleItem({ itemId }).catch(() => {
      // Revert on error
      setOptimisticIncluded(item.isIncluded);
    });
  }, [itemId, toggleItem, item.isIncluded]);

  // ── Delete handler ──

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await removeItem({ itemId });
    } catch {
      setIsDeleting(false);
    }
  };

  const isExcluded = !optimisticIncluded;

  return (
    <div
      className={`group/row relative flex items-start gap-3 rounded-md border p-3 transition-colors ${
        isExcluded
          ? "border-border/30 bg-muted/20 opacity-60"
          : "border-border/50 bg-card"
      }`}
      role="listitem"
    >
      {/* Include/exclude toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={optimisticIncluded}
        aria-label={optimisticIncluded ? "Included — click to exclude" : "Excluded — click to include"}
        onClick={handleToggle}
        className={`mt-1 flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
          optimisticIncluded
            ? "text-primary"
            : "text-muted-foreground"
        }`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
            optimisticIncluded
              ? "border-primary bg-primary"
              : "border-muted-foreground/40 bg-transparent"
          }`}
        >
          {optimisticIncluded && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
        </span>
      </button>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Desktop: single row | Mobile: stacked */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          {/* Description */}
          <div className={`flex-1 min-w-0 ${isExcluded ? "line-through" : ""}`}>
            <InlineEdit
              value={localDescription}
              onChange={setLocalDescription}
              placeholder="Enter description..."
              ariaLabel="description"
              className="w-full"
              inputClassName="w-full"
            />
          </div>

          {/* Quantity + Unit */}
          <div className="flex items-center gap-1.5 shrink-0">
            <InlineEdit
              value={localQuantity}
              onChange={setLocalQuantity}
              placeholder="Qty"
              ariaLabel="quantity"
              className="w-16 text-center text-muted-foreground"
              inputClassName="w-16 text-center"
            />
            <InlineEdit
              value={localUnit}
              onChange={setLocalUnit}
              placeholder="Unit"
              ariaLabel="unit"
              className="w-16 text-center text-muted-foreground"
              inputClassName="w-16 text-center"
            />
          </div>
        </div>

        {/* Bottom row: confidence + save status */}
        <div className="mt-1 flex items-center gap-2 px-2">
          <ConfidenceIndicator confidence={item.confidence} />

          {/* Save status */}
          {saveStatus === "saving" && (
            <span className="text-[11px] text-muted-foreground animate-pulse">
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-[11px] text-success animate-in fade-in duration-200">
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      <div className="shrink-0 pt-1 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete item"
                disabled={isDeleting}
              />
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
          </AlertDialogTrigger>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete item?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this line item from the scope.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
