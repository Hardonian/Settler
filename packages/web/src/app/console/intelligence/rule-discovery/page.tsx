"use client";

import { useEffect, useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, BrainCircuit, ArrowRight, CheckCircle2 } from "lucide-react";

export default function RuleDiscoveryPage() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/intelligence/rule-discovery");
        const json = await res.json();
        setSuggestions(json.data?.suggestions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <ConsolePageHeader
        title="Rule Discovery Engine"
        description="AI-powered analysis of your team's manual matching behavior to suggest new deterministic rules."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Analyzing audit logs...</p>
      ) : (
        <div className="grid gap-6">
          {suggestions.map((s) => (
            <Card key={s.id} className="overflow-hidden border-primary/20">
              <div className="bg-primary/5 px-6 py-4 flex items-center justify-between border-b border-primary/10">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{s.name}</CardTitle>
                  <Badge variant="outline" className="bg-background">
                    {(s.confidence * 100).toFixed(0)}% Confidence
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  {s.occurrences} historical occurrences
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-sm text-foreground mb-4">{s.description}</p>
                <div className="bg-muted/30 p-4 rounded-md border border-border/50 font-mono text-xs flex items-center gap-4">
                  <BrainCircuit className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Proposed Rule:</span>
                  <span className="text-primary font-bold">
                    {s.proposedRule.action.toUpperCase()}
                  </span>
                  <span>on</span>
                  <span className="bg-muted px-1.5 py-0.5 rounded">{s.proposedRule.field}</span>
                  {s.proposedRule.value && (
                    <>
                      <span>value</span>
                      <span className="bg-muted px-1.5 py-0.5 rounded text-amber-600">
                        "{s.proposedRule.value}"
                      </span>
                    </>
                  )}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline">Dismiss</Button>
                  <Button className="gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Create Rule{" "}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
