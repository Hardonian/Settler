"use client";

import { useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowRightLeft, Percent, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion/variants";

export default function AutoResolutionRulesPage() {
  const [rules, setRules] = useState([
    {
      id: "rule_1",
      name: "Rounding Error Approval",
      condition: "Absolute difference < $0.05",
      action: "Auto-approve as 'Rounding'",
      status: "active",
      matches: 1284,
    },
    {
      id: "rule_2",
      name: "Stripe Payout Fees",
      condition: "Mismatch matches expected Stripe fee %",
      action: "Auto-approve as 'Platform Fee'",
      status: "active",
      matches: 342,
    },
  ]);

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Auto-Resolution Rules Engine"
        description="Configure rules to automatically adjudicate common exceptions without operator intervention."
        breadcrumbs={[
          { label: "Policies", href: "/console/policies" },
          { label: "Auto-Resolution" },
        ]}
      />

      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Active Rules</h3>
            <p className="text-sm text-muted-foreground">
              Rules are evaluated sequentially top to bottom.
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Rule
          </Button>
        </div>

        <div className="grid gap-4">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="p-6 flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold">{rule.name}</h4>
                    <Badge variant={rule.status === "active" ? "success" : "secondary"}>
                      {rule.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ArrowRightLeft className="w-4 h-4 text-primary" />
                    <span>
                      If: <strong className="font-medium text-foreground">{rule.condition}</strong>
                    </span>
                    <span className="mx-2">→</span>
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    <span>
                      Then: <strong className="font-medium text-foreground">{rule.action}</strong>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-mono">{rule.matches}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Times Applied
                  </p>
                </div>
                <div className="pl-4 border-l border-border/50">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
