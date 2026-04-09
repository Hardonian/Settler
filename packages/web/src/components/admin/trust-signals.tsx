/**
 * Trust Signals Components
 *
 * Security badges, certifications, and trust indicators for admin dashboard.
 */

"use client";

import { Shield, Lock, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function SecurityBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
    >
      <Shield className="w-3 h-3 mr-1" />
      Secure
    </Badge>
  );
}

export function EncryptionBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
    >
      <Lock className="w-3 h-3 mr-1" />
      Encrypted
    </Badge>
  );
}

export function AuditTrailBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300"
    >
      <CheckCircle2 className="w-3 h-3 mr-1" />
      Audited
    </Badge>
  );
}

export function SystemStatusCard({ status }: { status: "operational" | "degraded" | "down" }) {
  const statusConfig = {
    operational: {
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      label: "All Systems Operational",
    },
    degraded: {
      icon: AlertCircle,
      color: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-900/20",
      border: "border-yellow-200 dark:border-yellow-800",
      label: "Degraded Performance",
    },
    down: {
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      label: "Service Disruption",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={`${config.bg} ${config.border} border`}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <div>
            <div className="text-sm font-medium text-foreground dark:text-white">System Status</div>
            <div className={`text-xs ${config.color}`}>{config.label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LastUpdatedBadge({ timestamp }: { timestamp: Date }) {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);

  let text: string;
  if (diffSeconds < 60) {
    text = "Just now";
  } else if (diffMinutes < 60) {
    text = `${diffMinutes}m ago`;
  } else {
    text = timestamp.toLocaleTimeString();
  }

  return (
    <Badge variant="outline" className="text-xs">
      <Clock className="w-3 h-3 mr-1" />
      Updated {text}
    </Badge>
  );
}
