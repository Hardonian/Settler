import { redirect } from "next/navigation";

/**
 * Legacy console alias retained for docs and external bookmarks.
 * Canonical operator surface currently lives under /dashboard/integrations.
 */
export default function ConsoleIntegrationsAliasPage() {
  redirect("/dashboard/integrations");
}
