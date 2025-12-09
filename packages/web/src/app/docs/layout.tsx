import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateDocsMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateDocsMetadata();

export default function DocsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
