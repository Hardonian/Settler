"use client";

import RoleMatrix from "@/components/RoleMatrix";
import PolicyViewer from "@/components/stitch-import/PolicyViewer";
import FreezeToggle from "@/components/FreezeToggle";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, History } from "lucide-react";

const recentMutations = [
  {
    id: "1",
    title: "Policy Update",
    detail: <>Modified restrict level from &apos;Internal&apos; to &apos;Confidential&apos; on <span className="font-mono text-primary">Auth_V2</span>.</>,
    actor: "Alex M.",
    actorInitials: "AM",
    actorColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    relativeTime: "2m ago",
    dotColor: "bg-primary",
  },
  {
    id: "2",
    title: "New Role Assigned",
    detail: <>Assigned &apos;Analyst&apos; role to <span className="text-primary font-medium">@sarah_j</span>.</>,
    actor: "Marcus R.",
    actorInitials: "MR",
    actorColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    relativeTime: "15m ago",
    dotColor: "bg-success",
  },
  {
    id: "3",
    title: "Failed Login Attempt",
    detail: "Multiple failed attempts from IP 192.168.x.x detected.",
    actor: "System",
    actorInitials: "S",
    actorColor: "bg-muted text-muted-foreground",
    relativeTime: "1h ago",
    dotColor: "bg-destructive",
  },
  {
    id: "4",
    title: "Workspace Config",
    detail: "Updated reconciliation batch size limit.",
    actor: "Alex M.",
    actorInitials: "AM",
    actorColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    relativeTime: "2h ago",
    dotColor: "bg-muted-foreground",
  },
];

export default function GovernancePage() {
  return (
    <div className="space-y-8 pb-8">
      <PageHeader
        eyebrow="Governance & Compliance"
        title="Governance"
        description="Manage policy versions, role boundaries, and operational freeze controls for this workspace."
        icon={ShieldCheck}
        variant="hero"
      />

      {/* Controls */}
      <div className="space-y-4">
        <div className="panel p-6">
          <FreezeToggle />
        </div>
        <div className="panel p-6">
          <RoleMatrix />
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/50 p-6 sm:p-8">
          <PolicyViewer initialPolicies={[]} />
        </div>
      </div>

      {/* Recent Mutations Timeline */}
      <Card className="panel shadow-sm">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-primary" aria-hidden="true" />
            Recent Mutations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="timeline-track">
            {recentMutations.map((item) => (
              <div key={item.id} className="relative">
                <div
                  className={`timeline-node ${item.dotColor}`}
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-xs font-bold text-foreground">{item.title}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {item.relativeTime}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-medium shrink-0 ${item.actorColor}`}
                      aria-hidden="true"
                    >
                      {item.actorInitials}
                    </span>
                    <span className="text-[10px] font-medium text-foreground">{item.actor}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button className="mt-6 w-full py-2.5 text-xs text-primary font-semibold rounded-lg border border-border/60 hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            View All Activity
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
