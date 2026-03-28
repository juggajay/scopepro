"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Coins, AlertTriangle } from "lucide-react";

export function CreditBalance() {
  const credits = useQuery(api.credits.getBalance);

  // Loading state
  if (credits === undefined) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-12" />
          </div>
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    );
  }

  const isLow = credits.balance <= 2;

  return (
    <div
      className={`flex items-center justify-between rounded-xl border p-4 ring-1 ${
        isLow
          ? "border-warning/40 bg-warning/5 ring-warning/20"
          : "border-border bg-card ring-foreground/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            isLow ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary"
          }`}
        >
          {isLow ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <Coins className="h-5 w-5" />
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Credit Balance</p>
          <p className="text-2xl font-semibold tabular-nums leading-tight">
            {credits.balance}
          </p>
        </div>
      </div>
      <Button size="sm" variant={isLow ? "default" : "outline"} render={<Link href="/account/credits" />}>
        {isLow ? "Buy Credits" : "Manage Credits"}
      </Button>
    </div>
  );
}

/**
 * Amber warning banner shown when credits are low.
 */
export function CreditWarningBanner() {
  const credits = useQuery(api.credits.getBalance);

  if (credits === undefined || credits.balance > 2) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        You have <strong>{credits.balance}</strong> credit{credits.balance !== 1 ? "s" : ""} left.
      </span>
      <Link
        href="/account/credits"
        className="ml-auto font-medium underline underline-offset-2 hover:no-underline"
      >
        Buy More
      </Link>
    </div>
  );
}
