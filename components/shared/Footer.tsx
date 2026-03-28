import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} ScopePro. Built by a tradie, for tradies.
        </p>
        <nav className="flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
