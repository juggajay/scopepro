"use client";

import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, LayoutDashboard, Coins } from "lucide-react";

export function Header() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          ScopePro
        </Link>

        <nav className="flex items-center gap-2">
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          ) : isAuthenticated ? (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/create" />}>
                New Scope
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <User className="h-4 w-4" />
                      <span className="sr-only">Account menu</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem render={<Link href="/account" />}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/account/credits" />}>
                    <Coins className="mr-2 h-4 w-4" />
                    Credits
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href="/account/settings" />}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/auth/login" />}>
                Log in
              </Button>
              <Button size="sm" render={<Link href="/auth/signup" />}>
                Sign up
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
