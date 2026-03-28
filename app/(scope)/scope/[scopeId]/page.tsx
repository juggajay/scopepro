"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ScopeEditor } from "@/components/scope/ScopeEditor";
import { ScopeSkeleton } from "@/components/scope/ScopeSkeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function ScopePage({
  params,
}: {
  params: Promise<{ scopeId: string }>;
}) {
  const { scopeId: scopeIdStr } = use(params);
  const scopeId = scopeIdStr as Id<"scopes">;

  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();

  // Redirect to login if not authenticated (middleware should handle this,
  // but this is a client-side safety net)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(`/auth/login?redirect=/scope/${scopeIdStr}`);
    }
  }, [authLoading, isAuthenticated, router, scopeIdStr]);

  // ── Data queries (skip if not authenticated yet) ──────────────────

  const scope = useQuery(
    api.scopes.getScope,
    isAuthenticated ? { scopeId } : "skip",
  );

  const items = useQuery(
    api.scopeItems.getItems,
    isAuthenticated ? { scopeId } : "skip",
  );

  // ── Redirect draft scopes back to the create flow ─────────────────

  useEffect(() => {
    if (!scope) return;
    if (scope.status === "draft") {
      // If the scope has photos, send to details; otherwise send to create
      if (scope.photos && scope.photos.length > 0) {
        router.replace(`/create/details/${scopeIdStr}`);
      } else {
        router.replace("/create");
      }
    }
  }, [scope, router, scopeIdStr]);

  // ── Auth loading ──────────────────────────────────────────────────

  if (authLoading) {
    return <ScopeSkeleton />;
  }

  if (!isAuthenticated) {
    return null; // Redirect is pending
  }

  // ── Data loading ──────────────────────────────────────────────────

  if (scope === undefined || items === undefined) {
    return <ScopeSkeleton />;
  }

  // ── Error / not found state ───────────────────────────────────────
  // useQuery throws on error, so if scope is loaded but null (shouldn't
  // happen due to the throw) or if draft redirect is pending, show nothing.
  // The real "not found" is caught by Convex throwing an error, which
  // Convex/React surfaces via ErrorBoundary. We handle it gracefully below.

  if (scope === null) {
    return <ScopeNotFound />;
  }

  // Draft redirect is pending
  if (scope.status === "draft") {
    return <ScopeSkeleton />;
  }

  // ── Render editor ─────────────────────────────────────────────────

  return <ScopeEditor scope={scope} items={items} />;
}

// ── Not found fallback ──────────────────────────────────────────────

function ScopeNotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold">Scope not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This scope may have been deleted or you may not have access to it.
      </p>
      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/account")}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Dashboard
        </Button>
        <Button size="sm" onClick={() => router.push("/create")}>
          New Scope
        </Button>
      </div>
    </div>
  );
}
