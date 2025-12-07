"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowUp } from "lucide-react";

interface UpgradeButtonProps {
  currentPlan: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
}

export function UpgradeButton({
  currentPlan,
  variant = "outline",
  size = "sm",
  showIcon = true,
}: UpgradeButtonProps) {
  // Don't show for paid plans
  if (currentPlan === "commercial" || currentPlan === "enterprise") {
    return null;
  }

  const isTrial = currentPlan === "trial";

  return (
    <Button variant={variant} size={size} asChild>
      <Link href="/pricing" className="flex items-center gap-2">
        {showIcon && <ArrowUp className="w-4 h-4" />}
        {isTrial ? "Upgrade to Keep Access" : "Upgrade"}
      </Link>
    </Button>
  );
}
