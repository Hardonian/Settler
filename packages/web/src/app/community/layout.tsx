import { Metadata } from "next";
import { generateMetadata } from "@/lib/metadata";

export const metadata: Metadata = generateMetadata({
  title: "Community - Join the Settler Community",
  description:
    "Join the Settler community to share feedback, engage with posts, and help shape the future of financial reconciliation. Connect with developers and finance teams using Settler.",
  keywords: [
    "Settler community",
    "developer community",
    "reconciliation community",
    "financial tech community",
  ],
  canonical: "https://settler.dev/community",
});

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
