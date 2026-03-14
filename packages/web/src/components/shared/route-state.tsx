"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type RouteStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

interface RouteStateProps {
  title: string;
  description: string;
  detail?: string;
  icon?: LucideIcon;
  actions?: RouteStateAction[];
  className?: string;
}

export function RouteStateCard({
  title,
  description,
  detail,
  icon: Icon = AlertTriangle,
  actions = [],
  className,
}: RouteStateProps) {
  return (
    <div className={className ?? "flex min-h-[60vh] items-center justify-center px-4 py-8"}>
      <Card className="w-full max-w-xl border-border/80 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-foreground">
            <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {(detail || actions.length > 0) && (
          <CardContent className="space-y-4">
            {detail ? <p className="text-sm text-muted-foreground">{detail}</p> : null}
            {actions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => {
                  const variant = action.variant ?? "default";
                  if (action.href) {
                    return (
                      <Button key={`${action.label}-${action.href}`} asChild variant={variant}>
                        <Link href={action.href}>{action.label}</Link>
                      </Button>
                    );
                  }

                  if (action.onClick) {
                    return (
                      <Button key={action.label} onClick={action.onClick} variant={variant}>
                        {action.label}
                      </Button>
                    );
                  }

                  return null;
                })}
              </div>
            ) : null}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
