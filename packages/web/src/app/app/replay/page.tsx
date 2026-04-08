import { redirect } from "next/navigation";

/**
 * Legacy /app replay surface.
 * Canonical operator replay lives under /console/replay.
 */
export default function AppReplayRedirectPage() {
  redirect("/console/replay");
}
