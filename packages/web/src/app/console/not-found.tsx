/**
 * Console Not Found Page
 *
 * Shows when a console route is not found.
 */

import { RouteStateCard, routeStateFromVariant } from "@/components/shared/route-state";

export default function ConsoleNotFound() {
  return <RouteStateCard {...routeStateFromVariant("not-found")} />;
}
