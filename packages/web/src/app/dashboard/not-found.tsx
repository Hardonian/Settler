import { SearchX } from "lucide-react";
import { RouteStateCard } from "@/components/shared/route-state";

export default function DashboardNotFound() {
  return (
    <RouteStateCard
      icon={SearchX}
      title="Dashboard page not found"
      description="This dashboard route no longer exists or was moved."
      detail="Return to the dashboard index to continue monitoring live metrics."
      actions={[{ label: "Back to dashboard", href: "/dashboard" }]}
    />
  );
}
