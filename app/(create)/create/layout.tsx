import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Scope",
  robots: { index: false },
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
