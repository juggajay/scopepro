"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "strata", label: "Strata" },
  { value: "industrial", label: "Industrial" },
  { value: "heritage", label: "Heritage" },
] as const;

const SCOPE_TYPES = [
  { value: "interior", label: "Interior" },
  { value: "exterior", label: "Exterior" },
  { value: "both", label: "Both" },
] as const;

const SURFACE_TYPES = [
  { value: "walls", label: "Walls" },
  { value: "ceilings", label: "Ceilings" },
  { value: "trim-skirting", label: "Trim / Skirting" },
  { value: "doors", label: "Doors" },
  { value: "windows", label: "Windows" },
  { value: "exterior-cladding", label: "Exterior cladding" },
  { value: "render", label: "Render" },
  { value: "timber", label: "Timber" },
] as const;

// ── Step Indicator ───────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ["Photos", "Details", "Generate"];
  return (
    <div className="flex items-center justify-center gap-2" role="navigation" aria-label="Progress">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isComplete = step < current;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-6 sm:w-10 ${
                  isComplete ? "bg-primary" : "bg-border"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isComplete
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  step
                )}
              </span>
              <span
                className={`hidden text-xs font-medium sm:inline ${
                  isActive
                    ? "text-foreground"
                    : isComplete
                      ? "text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Photo Thumbnails (context) ───────────────────────────────────────

function PhotoThumbnails({ storageIds }: { storageIds: string[] }) {
  if (storageIds.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {storageIds.map((id) => (
        <div
          key={id}
          className="size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:size-16"
        >
          <ConvexImage storageId={id as Id<"_storage">} />
        </div>
      ))}
    </div>
  );
}

function ConvexImage({ storageId }: { storageId: Id<"_storage"> }) {
  const url = useQuery(api.scopes.getPhotoUrl, { storageId });
  if (!url) {
    return <Skeleton className="size-full" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Uploaded photo" className="size-full object-cover" />
  );
}

// ── Checkbox Group ───────────────────────────────────────────────────

function SurfaceCheckboxGroup({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (surfaces: string[]) => void;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {SURFACE_TYPES.map(({ value, label }) => {
        const isChecked = selected.includes(value);
        return (
          <label
            key={value}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors select-none ${
              isChecked
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
            }`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggle(value)}
              className="size-4 rounded border-border text-primary accent-primary focus:ring-primary"
            />
            {label}
          </label>
        );
      })}
    </div>
  );
}

// ── Scope Type Radio Buttons ─────────────────────────────────────────

function ScopeTypeButtons({
  value,
  onChange,
}: {
  value: string | undefined;
  onChange: (v: "interior" | "exterior" | "both") => void;
}) {
  return (
    <div className="flex gap-2">
      {SCOPE_TYPES.map(({ value: v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v as "interior" | "exterior" | "both")}
          className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
            value === v
              ? "border-primary bg-primary/10 text-foreground"
              : "border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
          }`}
          aria-pressed={value === v}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function DetailsPage({
  params,
}: {
  params: Promise<{ scopeId: string }>;
}) {
  const { scopeId: scopeIdStr } = use(params);
  const scopeId = scopeIdStr as Id<"scopes">;

  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const scope = useQuery(api.scopes.getScope, { scopeId });
  const updateScope = useMutation(api.scopes.update);

  // ── Local form state ──────────────────────────────────────────────

  const [propertyType, setPropertyType] = useState("");
  const [scopeType, setScopeType] = useState<
    "interior" | "exterior" | "both" | undefined
  >();
  const [surfaceTypes, setSurfaceTypes] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [specialRequirements, setSpecialRequirements] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Initialize form state from scope data
  useEffect(() => {
    if (scope && !initialized) {
      setPropertyType(scope.propertyType ?? "");
      setScopeType(scope.scopeType ?? undefined);
      setSurfaceTypes(scope.surfaceTypes ?? []);
      setDescription(scope.description ?? "");
      setSpecialRequirements(scope.specialRequirements ?? "");
      setInitialized(true);
    }
  }, [scope, initialized]);

  // ── Debounced auto-save ───────────────────────────────────────────

  const debouncedPropertyType = useDebounce(propertyType, 500);
  const debouncedScopeType = useDebounce(scopeType, 500);
  const debouncedSurfaceTypes = useDebounce(surfaceTypes, 500);
  const debouncedDescription = useDebounce(description, 500);
  const debouncedSpecialRequirements = useDebounce(specialRequirements, 500);

  const saveFields = useCallback(async () => {
    if (!initialized) return;

    setSaving(true);
    try {
      const fields: Parameters<typeof updateScope>[0] = { scopeId };

      if (debouncedPropertyType) {
        fields.propertyType = debouncedPropertyType;
      }
      if (debouncedScopeType) {
        fields.scopeType = debouncedScopeType;
      }
      if (debouncedSurfaceTypes.length > 0) {
        fields.surfaceTypes = debouncedSurfaceTypes;
      }
      if (debouncedDescription) {
        fields.description = debouncedDescription;
      }
      if (debouncedSpecialRequirements) {
        fields.specialRequirements = debouncedSpecialRequirements;
      }

      await updateScope(fields);
    } catch {
      // Silently fail — data is still in local state
    } finally {
      setSaving(false);
    }
  }, [
    initialized,
    scopeId,
    debouncedPropertyType,
    debouncedScopeType,
    debouncedSurfaceTypes,
    debouncedDescription,
    debouncedSpecialRequirements,
    updateScope,
  ]);

  useEffect(() => {
    saveFields();
  }, [saveFields]);

  // ── Generate handler ──────────────────────────────────────────────

  const [navigating, setNavigating] = useState(false);

  const handleGenerate = async () => {
    setGenerateError(null);

    // Auth gate
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/create/details/${scopeId}`);
      return;
    }

    // Validate minimum fields
    if (!description.trim()) {
      setGenerateError("Please describe the job before generating.");
      return;
    }

    // Save any pending changes immediately
    try {
      const fields: Parameters<typeof updateScope>[0] = { scopeId };
      if (propertyType) fields.propertyType = propertyType;
      if (scopeType) fields.scopeType = scopeType;
      if (surfaceTypes.length > 0) fields.surfaceTypes = surfaceTypes;
      if (description) fields.description = description;
      if (specialRequirements) fields.specialRequirements = specialRequirements;
      await updateScope(fields);
    } catch {
      // Continue anyway — most fields already saved via debounce
    }

    setNavigating(true);
    router.push(`/create/processing/${scopeId}`);
  };

  // ── Loading state ─────────────────────────────────────────────────

  if (!scope) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <p className="text-sm font-semibold tracking-tight">ScopePro</p>
          <StepIndicator current={2} />
          <div className="w-16" />
        </header>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="size-14 rounded-lg" />
            ))}
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <p className="text-sm font-semibold tracking-tight">ScopePro</p>
        <StepIndicator current={2} />
        <div className="w-16" />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 pb-24 sm:px-6 sm:py-8">
        {/* Back button + Title */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.back()}
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Job details
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Help us generate an accurate scope of work.
            </p>
          </div>
        </div>

        {/* Photo thumbnails */}
        <PhotoThumbnails storageIds={scope.photos as unknown as string[]} />

        {/* Auto-save indicator */}
        {saving && (
          <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
            Saving...
          </p>
        )}

        {/* Form fields — responsive two-column layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column: selectors */}
          <div className="space-y-5">
            {/* Property type */}
            <div className="space-y-2">
              <Label htmlFor="property-type">Property type</Label>
              <Select
                value={propertyType}
                onValueChange={(v) => setPropertyType(v ?? "")}
              >
                <SelectTrigger className="w-full" id="property-type">
                  <SelectValue placeholder="Select property type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map(({ value: v, label }) => (
                    <SelectItem key={v} value={v}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Scope type */}
            <div className="space-y-2">
              <Label>Scope type</Label>
              <ScopeTypeButtons value={scopeType} onChange={setScopeType} />
            </div>

            {/* Surface types */}
            <div className="space-y-2">
              <Label>Surfaces to include</Label>
              <SurfaceCheckboxGroup
                selected={surfaceTypes}
                onChange={setSurfaceTypes}
              />
            </div>
          </div>

          {/* Right column: text fields */}
          <div className="space-y-5">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                What's the job? <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="e.g. Full repaint of 3-bedroom house interior, including all walls, ceilings, and trim. Existing paint is in fair condition with some patches needed."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {/* Special requirements */}
            <div className="space-y-2">
              <Label htmlFor="special-requirements">
                Special requirements{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="special-requirements"
                placeholder="e.g. Suspected lead paint on exterior trim. Second-storey access required. Heritage colour scheme must be maintained."
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {generateError && (
          <div
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="size-4 shrink-0" />
            {generateError}
          </div>
        )}
      </main>

      {/* Sticky bottom CTA */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <p className="hidden text-xs text-muted-foreground sm:block">
            {scope.photos.length} photo{scope.photos.length === 1 ? "" : "s"} uploaded
          </p>
          <Button
            onClick={handleGenerate}
            disabled={navigating}
            size="lg"
            className="ml-auto gap-1.5"
          >
            {navigating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="size-4" data-icon="inline-start" />
                Generate Scope
                <ArrowRight className="size-4" data-icon="inline-end" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
