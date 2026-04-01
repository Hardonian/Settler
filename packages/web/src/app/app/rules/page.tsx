"use client";

import { Rocket, Clock } from "lucide-react";
import RulesEditor from "@/components/stitch-import/RulesEditor";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlaskConical } from "lucide-react";

export default function RulesPage() {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        eyebrow="Execution Infrastructure"
        title="Rules & Configuration"
        description="Define and version the tolerance rules that govern reconciliation evaluation. Changes are versioned and hash-locked before deployment."
        icon={FlaskConical}
        variant="hero"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
              <span>System Healthy</span>
            </div>
            <Badge variant="outline" className="font-mono text-[10px]">v2.3.1</Badge>
          </div>
        }
      />

      <div className="panel p-0 overflow-hidden">
        <RulesEditor />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" size="sm" className="gap-2">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Version History
        </Button>
        <Button
          size="sm"
          className="gap-2"
          disabled
          title="No pending changes to deploy"
        >
          <Rocket className="h-3.5 w-3.5" aria-hidden="true" />
          Save & Deploy v2.4
        </Button>
      </div>
    </div>
  );
}
