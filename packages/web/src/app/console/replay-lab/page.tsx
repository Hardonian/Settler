import { redirect } from "next/navigation";

/**
 * Legacy shell alias retained for backward compatibility.
 * Canonical replay workspace is /console/replay.
 */
export default function ConsoleReplayLabRedirectPage() {
  redirect("/console/replay");
}
