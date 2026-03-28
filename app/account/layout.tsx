import type { Metadata } from "next";
import { Header } from "@/components/shared/Header";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
