import { Metadata } from "next";
import { generateDocsMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateDocsMetadata();

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
