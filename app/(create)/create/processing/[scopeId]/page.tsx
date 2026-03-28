"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Camera,
  Sparkles,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";

// ── Constants ────────────────────────────────────────────────────────

const STAGES = [
  {
    key: "analyzing" as const,
    label: "Analyzing Photos",
    description: "Inspecting surfaces, conditions, and areas...",
    icon: Camera,
  },
  {
    key: "generating" as const,
    label: "Generating Scope",
    description: "Building line items for each trade...",
    icon: Sparkles,
  },
  {
    key: "validating" as const,
    label: "Validating",
    description: "Checking accuracy and completeness...",
    icon: ShieldCheck,
  },
];

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

// ── Photo Strip (reassurance) ────────────────────────────────────────

function PhotoStrip({ storageIds }: { storageIds: string[] }) {
  if (storageIds.length === 0) return null;

  return (
    <div className="flex justify-center gap-2">
      {storageIds.map((id) => (
        <div
          key={id}
          className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:size-16"
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
    <img src={url} alt="Processing photo" className="size-full object-cover" />
  );
}

// ── Stage Progress ───────────────────────────────────────────────────

function StageProgress({
  currentStage,
}: {
  currentStage: string | undefined;
}) {
  const activeIndex = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {STAGES.map((stage, i) => {
        const Icon = stage.icon;
        const isComplete = activeIndex > i;
        const isActive = activeIndex === i;
        const isPending = activeIndex < i;

        return (
          <div
            key={stage.key}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all sm:px-5 sm:py-4 ${
              isActive
                ? "border-primary/30 bg-primary/5"
                : isComplete
                  ? "border-border bg-muted/30"
                  : "border-border/50 bg-transparent opacity-50"
            }`}
            role="status"
            aria-label={`${stage.label}: ${isComplete ? "complete" : isActive ? "in progress" : "pending"}`}
          >
            <div
              className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                isComplete
                  ? "bg-primary/20 text-primary"
                  : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="size-4" />
              ) : isActive ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Icon className="size-4" />
              )}
            </div>

            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  isPending ? "text-muted-foreground" : "text-foreground"
                }`}
              >
                {stage.label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isComplete
                  ? "Done"
                  : isActive
                    ? stage.description
                    : "Waiting..."}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function ProcessingPage({
  params,
}: {
  params: Promise<{ scopeId: string }>;
}) {
  const { scopeId: scopeIdStr } = use(params);
  const scopeId = scopeIdStr as Id<"scopes">;

  const router = useRouter();
  const scope = useQuery(api.scopes.getScope, { scopeId });
  const generateScope = useAction(api.ai.generateScope);

  const [hasStarted, setHasStarted] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const generationTriggered = useRef(false);

  // ── Trigger generation on mount ───────────────────────────────────

  useEffect(() => {
    if (!scope) return;
    if (generationTriggered.current) return;
    if (scope.status !== "draft") return;

    // Don't trigger if already has an error (user may be retrying)
    if (scope.generationError && !hasStarted) return;

    generationTriggered.current = true;
    setHasStarted(true);
    setActionError(null);

    generateScope({ scopeId }).catch((err) => {
      const message =
        err instanceof Error ? err.message : "Generation failed";
      setActionError(message);
    });
  }, [scope, scopeId, generateScope, hasStarted]);

  // ── Auto-redirect on success ──────────────────────────────────────

  useEffect(() => {
    if (scope?.status === "generated") {
      router.replace(`/scope/${scopeId}`);
    }
  }, [scope?.status, scopeId, router]);

  // ── Retry handler ─────────────────────────────────────────────────

  const handleRetry = () => {
    generationTriggered.current = false;
    setActionError(null);
    setHasStarted(true);

    generateScope({ scopeId }).catch((err) => {
      const message =
        err instanceof Error ? err.message : "Generation failed";
      setActionError(message);
    });
  };

  // ── Determine error state ─────────────────────────────────────────

  const errorMessage =
    actionError || scope?.generationError || null;
  const isError = !!errorMessage;
  const isGenerating = hasStarted && !isError && scope?.status === "draft";

  // ── Loading state ─────────────────────────────────────────────────

  if (!scope) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <p className="text-sm font-semibold tracking-tight">ScopePro</p>
          <StepIndicator current={3} />
          <div className="w-16" />
        </header>
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading scope...</p>
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
        <StepIndicator current={3} />
        <div className="w-16" />
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center gap-8 px-4 py-8 sm:py-12">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {isError
              ? "Generation failed"
              : isGenerating
                ? "Generating your scope..."
                : "Preparing..."}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isError
              ? "Something went wrong. Your credit has been refunded."
              : "This usually takes 30-60 seconds. Don't close this page."}
          </p>
        </div>

        {/* Photo strip */}
        <PhotoStrip storageIds={scope.photos as unknown as string[]} />

        {/* Error state */}
        {isError && (
          <div className="flex w-full max-w-sm flex-col items-center gap-4">
            <div
              className="flex w-full items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium">Generation failed</p>
                <p className="mt-0.5 text-xs opacity-80">
                  {errorMessage}
                </p>
                <p className="mt-1 text-xs opacity-80">
                  Credit refunded. You can try again.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/create/details/${scopeId}`)}
              >
                <ArrowLeft className="size-4" data-icon="inline-start" />
                Edit Details
              </Button>
              <Button onClick={handleRetry} className="gap-1.5">
                <RotateCcw className="size-4" data-icon="inline-start" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Progress stages */}
        {isGenerating && (
          <div className="w-full max-w-sm">
            <StageProgress currentStage={scope.generationStage ?? "analyzing"} />
          </div>
        )}

        {/* Animated dots for waiting feel */}
        {isGenerating && (
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-1.5 animate-pulse rounded-full bg-primary/40 [animation-delay:0ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-primary/40 [animation-delay:300ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-primary/40 [animation-delay:600ms]" />
          </div>
        )}
      </main>
    </div>
  );
}

