/**
 * Console Not Found Page
 *
 * Shows when a console route is not found.
 */

import { SearchX } from "lucide-react";
import { RouteStateCard } from "@/components/shared/route-state";

export default function ConsoleNotFound() {
  return (
    <RouteStateCard
      icon={SearchX}
      title="Console page not found"
      description="The route you requested does not exist in the Developer Console."
      detail="Check the URL or return to the console overview to continue operations."
      actions={[
        { label: "Go to console", href: "/console" },
        { label: "Go home", href: "/", variant: "outline" },
      ]}
    />
  );
}
