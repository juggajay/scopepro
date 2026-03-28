import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-4xl font-semibold">404</h1>
        <p className="text-muted-foreground">
          This page doesn&apos;t exist.
        </p>
        <Button render={<Link href="/" />}>Go home</Button>
      </main>
    </div>
  );
}
