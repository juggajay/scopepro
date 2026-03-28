"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Home,
  Building2,
  Building,
  Warehouse,
  Trash2,
  FileText,
  Calendar,
} from "lucide-react";
import { useState } from "react";

type ScopeStatus = "draft" | "generated" | "sent" | "viewed";

interface ScopeCardProps {
  scope: {
    _id: Id<"scopes">;
    description?: string;
    status: string;
    propertyType?: string;
    createdAt: number;
  };
}

const STATUS_CONFIG: Record<
  ScopeStatus,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  generated: { label: "Generated", variant: "default" },
  sent: { label: "Sent", variant: "default" },
  viewed: { label: "Viewed", variant: "outline" },
};

function PropertyIcon({ type }: { type?: string }) {
  const className = "h-4 w-4 text-muted-foreground";
  switch (type?.toLowerCase()) {
    case "apartment":
    case "unit":
      return <Building2 className={className} />;
    case "commercial":
    case "office":
      return <Building className={className} />;
    case "warehouse":
    case "industrial":
      return <Warehouse className={className} />;
    default:
      return <Home className={className} />;
  }
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + "...";
}

export function ScopeCard({ scope }: ScopeCardProps) {
  const router = useRouter();
  const softDelete = useMutation(api.scopes.softDelete);
  const [deleting, setDeleting] = useState(false);

  const status = scope.status as ScopeStatus;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const description = scope.description || "Untitled scope";
  const dateStr = new Date(scope.createdAt).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  function handleClick() {
    if (status === "draft") {
      router.push(`/create?scopeId=${scope._id}`);
    } else {
      router.push(`/scope/${scope._id}`);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await softDelete({ scopeId: scope._id });
    } catch {
      // silently fail — the scope card will remain
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card
      className="group cursor-pointer transition-shadow hover:ring-2 hover:ring-primary/20"
      onClick={handleClick}
    >
      <CardContent className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <PropertyIcon type={scope.propertyType} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium leading-snug">
                {truncate(description, 80)}
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {dateStr}
              </span>
              {scope.propertyType && (
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {scope.propertyType}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge variant={config.variant}>{config.label}</Badge>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                />
              }
            >
              <Trash2 className="h-3 w-3 text-muted-foreground" />
              <span className="sr-only">Delete scope</span>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this scope?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the scope from your dashboard. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton placeholder for scope cards during loading.
 */
export function ScopeCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
      </CardContent>
    </Card>
  );
}
