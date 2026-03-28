import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Scope of Works",
  robots: { index: false, follow: false },
};

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Minimal branding bar */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-12 max-w-3xl items-center px-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-muted-foreground transition-colors hover:text-foreground"
          >
            ScopePro
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>

      {/* Minimal footer */}
      <footer className="border-t border-border/30 py-4 text-center">
        <p className="text-xs text-muted-foreground">
          Powered by{" "}
          <Link
            href="/"
            className="font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            ScopePro
          </Link>
        </p>
      </footer>
    </div>
  );
}
