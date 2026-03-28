"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Loader2 } from "lucide-react";

interface AddItemButtonProps {
  scopeId: Id<"scopes">;
  category: string;
}

/**
 * Button that expands into a mini form for manually adding a scope item.
 * Category is pre-filled from the parent group.
 */
export function AddItemButton({ scopeId, category }: AddItemButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const addItem = useMutation(api.scopeItems.addItem);
  const descriptionRef = useRef<HTMLInputElement>(null);

  // Focus description field when form opens
  useEffect(() => {
    if (isOpen && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) return;

    setIsSaving(true);
    try {
      await addItem({
        scopeId,
        category,
        description: trimmed,
        quantity: quantity.trim() || undefined,
        unit: unit.trim() || undefined,
        isIncluded: true,
        confidence: "high",
      });
      // Reset and close
      setDescription("");
      setQuantity("");
      setUnit("");
      setIsOpen(false);
    } catch {
      // Error is swallowed — Convex will show a toast via Sonner
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDescription("");
    setQuantity("");
    setUnit("");
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full min-h-[44px] items-center justify-center gap-1.5 rounded-md border border-dashed border-border/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={`Add item to ${category}`}
      >
        <Plus className="h-4 w-4" />
        Add item
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-md border border-border bg-muted/30 p-3"
    >
      <div className="text-xs font-medium text-muted-foreground">
        New item in {category}
      </div>

      <Input
        ref={descriptionRef}
        placeholder="Description (e.g. Sand and prime window frames)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isSaving}
        required
        className="min-h-[44px]"
        aria-label="Item description"
      />

      <div className="flex gap-2">
        <Input
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={isSaving}
          className="w-24 min-h-[44px]"
          aria-label="Quantity"
        />
        <Input
          placeholder="Unit (e.g. m2, LM)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          disabled={isSaving}
          className="w-32 min-h-[44px]"
          aria-label="Unit"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="mr-1 h-3.5 w-3.5" />
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isSaving || !description.trim()}>
          {isSaving ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="mr-1 h-3.5 w-3.5" />
          )}
          Add
        </Button>
      </div>
    </form>
  );
}
