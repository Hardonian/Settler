"use client";

import { useEffect, useState } from "react";
import { ConsolePageHeader } from "@/components/console/ConsolePageHeader";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { ShieldCheck, MapPin, EyeOff, FileKey } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function DataResidencyPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/v1/security/data-residency");
        const json = await res.json();
        setSettings(json.data);
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
        title="Data Residency & PII Controls"
        description="Configure geo-fencing, data localization, and automated PII redaction (CISO & InfoSec)."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading security policies...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Regional Geo-Fencing
              </CardTitle>
              <CardDescription>
                All customer ledger data is physically stored within these regions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm font-medium">Primary Processing Region</span>
                <Badge variant="outline" className="font-mono bg-primary/5">
                  {settings?.primaryRegion}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm font-medium">Failover / Disaster Recovery</span>
                <Badge variant="outline" className="font-mono bg-primary/5">
                  {settings?.failoverRegion}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium">Data Retention Policy</span>
                <span className="text-sm font-mono text-muted-foreground">
                  {settings?.dataRetentionDays} Days
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <EyeOff className="w-5 h-5 text-primary" />
                PII Redaction Engine
              </CardTitle>
              <CardDescription>
                Automatically mask sensitive fields before they reach Operators.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Strict Masking Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Applies *** masking to all matched fields.
                  </p>
                </div>
                <Switch checked={settings?.piiRedaction.enabled} />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Protected Fields
                </Label>
                <div className="flex flex-wrap gap-2">
                  {settings?.piiRedaction.redactedFields.map((field: string) => (
                    <Badge key={field} variant="secondary" className="flex items-center gap-1">
                      <FileKey className="w-3 h-3" /> {field}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Continuous Compliance Framework
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {settings?.complianceCertifications.map((cert: string) => (
                  <div
                    key={cert}
                    className="px-4 py-3 bg-muted/30 border border-border/50 rounded-lg flex flex-col items-center justify-center flex-1"
                  >
                    <ShieldCheck className="w-8 h-8 text-green-500 mb-2" />
                    <span className="text-sm font-semibold">{cert}</span>
                    <span className="text-xs text-muted-foreground mt-1">Verified</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
