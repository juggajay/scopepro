"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, Loader2, ShoppingCart, Clock } from "lucide-react";
import { toast } from "sonner";

const PACKS = [
  { size: 10 as const, price: 29, label: "10 Credits", badge: null },
  { size: 25 as const, price: 59, label: "25 Credits", badge: "Most Popular" },
  { size: 50 as const, price: 99, label: "50 Credits", badge: null },
];

export default function CreditsPage() {
  const credits = useQuery(api.credits.getBalance);
  const purchases = useQuery(api.account.getPurchaseHistory);
  const createCheckout = useAction(api.stripe.createCheckoutSession);
  const searchParams = useSearchParams();

  const [buyingPack, setBuyingPack] = useState<number | null>(null);

  // Handle purchase redirect URL params
  useEffect(() => {
    const purchase = searchParams.get("purchase");
    if (purchase === "success") {
      toast.success("Credits purchased successfully! Your balance has been updated.");
      window.history.replaceState({}, "", "/account/credits");
    } else if (purchase === "cancelled") {
      toast.info("Purchase cancelled. No charges were made.");
      window.history.replaceState({}, "", "/account/credits");
    }
  }, [searchParams]);

  async function handleBuy(packSize: 10 | 25 | 50) {
    setBuyingPack(packSize);
    try {
      const url = await createCheckout({ packSize });
      window.location.href = url;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to start checkout"
      );
      setBuyingPack(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Credits</h1>
        <p className="text-sm text-muted-foreground">
          Purchase credits to generate scopes of work
        </p>
      </div>

      {/* Current balance */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 ring-1 ring-foreground/10">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Current Balance</p>
          {credits === undefined ? (
            <Skeleton className="mt-1 h-9 w-16" />
          ) : (
            <p className="text-3xl font-bold tabular-nums leading-tight">
              {credits.balance}
            </p>
          )}
        </div>
      </div>

      {/* Credit packs */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Buy Credit Packs</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PACKS.map((pack) => (
            <Card
              key={pack.size}
              className={`relative ${
                pack.badge
                  ? "ring-2 ring-primary"
                  : ""
              }`}
            >
              {pack.badge && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge>{pack.badge}</Badge>
                </div>
              )}
              <CardHeader className="pb-2 text-center">
                <CardTitle className="text-lg">{pack.label}</CardTitle>
                <p className="text-2xl font-bold text-primary">
                  ${pack.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    AUD
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  ${(pack.price / pack.size).toFixed(2)} per scope
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  className="w-full"
                  variant={pack.badge ? "default" : "outline"}
                  disabled={buyingPack !== null}
                  onClick={() => handleBuy(pack.size)}
                >
                  {buyingPack === pack.size ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Buy
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Purchase history */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Purchase History</h2>

        {purchases === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center">
            <Clock className="mb-2 h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No purchases yet. Buy your first credit pack above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-lg border border-border">
            {purchases.map((p: any) => (
              <div
                key={p._id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {p.packSize} credits
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="text-sm font-medium tabular-nums">
                  ${(p.amount / 100).toFixed(2)} AUD
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
