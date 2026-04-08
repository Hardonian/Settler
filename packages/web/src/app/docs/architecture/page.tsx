import { redirect } from "next/navigation";

/**
 * Canonical architecture docs route lives at /docs/architecture/platform-architecture.
 * Keep this page-level alias to preserve route-truth for in-app links.
 */
export default function DocsArchitectureAliasPage() {
  redirect("/docs/architecture/platform-architecture");
}
