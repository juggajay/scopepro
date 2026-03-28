"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton that matches the ScopeEditor layout.
 * Shows skeleton blocks for header, action bar, and item groups.
 */
export function ScopeSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-28" />
        </div>
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Action bar skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Category group skeletons */}
      {[1, 2, 3].map((group) => (
        <div key={group} className="space-y-3 rounded-lg border border-border p-4">
          {/* Category header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Item rows */}
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-md border border-border/50 p-3"
            >
              <Skeleton className="h-5 w-5 shrink-0 rounded" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-full max-w-md" />
                <div className="flex gap-2">
                  <Skeleton className="h-3.5 w-12" />
                  <Skeleton className="h-3.5 w-10" />
                </div>
              </div>
              <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
