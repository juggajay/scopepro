"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CreditBalance, CreditWarningBanner } from "@/components/account/CreditBalance";
import { ScopeCard, ScopeCardSkeleton } from "@/components/account/ScopeCard";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function AccountDashboardPage() {
  const scopes = useQuery(api.scopes.getUserScopes);
  const searchParams = useSearchParams();

  // Handle purchase redirect URL params
  useEffect(() => {
    const purchase = searchParams.get("purchase");
    if (purchase === "success") {
      toast.success("Credits purchased successfully!");
      // Clean the URL param without full reload
      window.history.replaceState({}, "", "/account");
    } else if (purchase === "cancelled") {
      toast.info("Purchase cancelled.");
      window.history.replaceState({}, "", "/account");
    }
  }, [searchParams]);

  const isLoading = scopes === undefined;
  const isEmpty = scopes !== undefined && scopes.length === 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your scopes and credits
          </p>
        </div>
        <Button size="sm" render={<Link href="/create" />}>
          <Plus className="h-4 w-4" />
          New Scope
        </Button>
      </div>

      {/* Credit balance */}
      <CreditBalance />

      {/* Low credit warning */}
      <CreditWarningBanner />

      {/* Scope list */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Your Scopes
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            <ScopeCardSkeleton />
            <ScopeCardSkeleton />
            <ScopeCardSkeleton />
          </div>
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {scopes.map((scope: any) => (
              <ScopeCard key={scope._id} scope={scope} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-base font-semibold">Welcome to ScopePro!</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        You have 3 free scopes to get started. Upload photos of a paint job and
        get a professional scope of work in under 2 minutes.
      </p>
      <Button className="mt-4" render={<Link href="/create" />}>
        <Plus className="h-4 w-4" />
        Create Your First Scope
      </Button>
    </div>
  );
}
