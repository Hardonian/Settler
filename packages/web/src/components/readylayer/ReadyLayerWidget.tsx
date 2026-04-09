/**
 * ReadyLayer Widget Component
 *
 * Main widget component that adapts to platform design.
 * Used in GitHub/GitLab/Bitbucket integrations.
 */

"use client";

import React from "react";
import { usePlatform } from "./PlatformProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Settings, ArrowRight } from "lucide-react";

interface ReadyLayerWidgetProps {
  repositoryName: string;
  reconciliationCount?: number;
  onViewDashboard?: () => void;
  onConfigure?: () => void;
}

export function ReadyLayerWidget({
  repositoryName,
  reconciliationCount = 0,
  onViewDashboard,
  onConfigure,
}: ReadyLayerWidgetProps) {
  const { theme, provider } = usePlatform();

  return (
    <Card
      className="readylayer-widget"
      style={{
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: theme.colors.primary }}
            >
              RL
            </div>
            <div>
              <CardTitle className="text-base" style={{ color: theme.colors.text }}>
                ReadyLayer
              </CardTitle>
              <p className="text-xs opacity-70" style={{ color: theme.colors.text }}>
                {repositoryName}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            style={{
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
          >
            {provider}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-70" style={{ color: theme.colors.text }}>
              Reconciliations
            </div>
            <div className="text-2xl font-bold" style={{ color: theme.colors.text }}>
              {reconciliationCount.toLocaleString()}
            </div>
          </div>
          <Activity className="w-8 h-8 opacity-20" style={{ color: theme.colors.primary }} />
        </div>

        <div className="flex gap-2 pt-2 border-t" style={{ borderColor: theme.colors.border }}>
          <Button
            size="sm"
            className="flex-1"
            onClick={onViewDashboard}
            style={{
              backgroundColor: theme.colors.primary,
              color: "#ffffff",
            }}
          >
            View Dashboard
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onConfigure}
            style={{
              borderColor: theme.colors.border,
              color: theme.colors.text,
            }}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
