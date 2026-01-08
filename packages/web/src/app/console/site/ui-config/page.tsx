/**
 * Runtime UI Config Editor (Console)
 *
 * Persists runtime UI config to tenant metadata (env-scoped by default).
 */

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Tone = "info" | "warning" | "success";
type Density = "comfortable" | "compact";
type CardElevation = "none" | "sm" | "default" | "lg";

export default function RuntimeUiConfigPage() {
  const [environment, setEnvironment] = useState<string>("preview");
  const [scope, setScope] = useState<"env" | "global">("env");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [density, setDensity] = useState<Density>("comfortable");
  const [radiusScale, setRadiusScale] = useState("1");
  const [cardElevation, setCardElevation] = useState<CardElevation>("default");

  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerTone, setBannerTone] = useState<Tone>("info");
  const [bannerMessage, setBannerMessage] = useState("");
  const [bannerLinkLabel, setBannerLinkLabel] = useState("");
  const [bannerLinkHref, setBannerLinkHref] = useState("");

  const [chatbot, setChatbot] = useState(true);
  const [floatingHelp, setFloatingHelp] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/console/site/ui-config?environment=${encodeURIComponent(environment)}`);
      if (!res.ok) throw new Error("Failed to load UI config");
      const data = await res.json();
      const resolved = data?.resolved;
      if (resolved) {
        setDensity(resolved.tokens?.density ?? "comfortable");
        setRadiusScale(String(resolved.tokens?.radiusScale ?? 1));
        setCardElevation(resolved.tokens?.cardElevation ?? "default");
        setBannerEnabled(!!resolved.copy?.announcement?.enabled);
        setBannerTone(resolved.copy?.announcement?.tone ?? "info");
        setBannerMessage(resolved.copy?.announcement?.message ?? "");
        setBannerLinkLabel(resolved.copy?.announcement?.linkLabel ?? "");
        setBannerLinkHref(resolved.copy?.announcement?.linkHref ?? "");
        setChatbot(resolved.features?.chatbot ?? true);
        setFloatingHelp(resolved.features?.floatingHelp ?? true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environment]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/console/site/ui-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environment,
          scope,
          config: {
            tokens: {
              density,
              radiusScale: Number(radiusScale),
              cardElevation,
            },
            copy: {
              announcement: {
                enabled: bannerEnabled,
                tone: bannerTone,
                message: bannerMessage,
                linkLabel: bannerLinkLabel || undefined,
                linkHref: bannerLinkHref || undefined,
              },
            },
            features: { chatbot, floatingHelp },
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to save UI config");
      }
      await load();
      alert("Saved");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-electric-cyan mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading UI config...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Runtime UI Config</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Edits apply without redeploy. Stored per-tenant and (by default) per-environment.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Target</CardTitle>
          <CardDescription>Choose the environment and scope to update</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Environment</Label>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preview">preview</SelectItem>
                <SelectItem value="production">production</SelectItem>
                <SelectItem value="development">development</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Scope</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="env">Environment-only</SelectItem>
                <SelectItem value="global">Global (all envs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tokens</CardTitle>
          <CardDescription>Global UI polish knobs</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Density</Label>
            <Select value={density} onValueChange={(v) => setDensity(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">comfortable</SelectItem>
                <SelectItem value="compact">compact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Radius scale</Label>
            <Input value={radiusScale} onChange={(e) => setRadiusScale(e.target.value)} inputMode="decimal" />
          </div>
          <div className="space-y-2">
            <Label>Card elevation</Label>
            <Select value={cardElevation} onValueChange={(v) => setCardElevation(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">none</SelectItem>
                <SelectItem value="sm">sm</SelectItem>
                <SelectItem value="default">default</SelectItem>
                <SelectItem value="lg">lg</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Announcement Banner</CardTitle>
          <CardDescription>Global banner shown from runtime config</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enabled</Label>
            <Switch checked={bannerEnabled} onCheckedChange={setBannerEnabled} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={bannerTone} onValueChange={(v) => setBannerTone(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">info</SelectItem>
                  <SelectItem value="warning">warning</SelectItem>
                  <SelectItem value="success">success</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Message</Label>
              <Input value={bannerMessage} onChange={(e) => setBannerMessage(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Link label (optional)</Label>
              <Input value={bannerLinkLabel} onChange={(e) => setBannerLinkLabel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Link href (optional)</Label>
              <Input value={bannerLinkHref} onChange={(e) => setBannerLinkHref(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optional Widgets</CardTitle>
          <CardDescription>Useful to disable during final polish</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between">
            <Label>Floating help</Label>
            <Switch checked={floatingHelp} onCheckedChange={setFloatingHelp} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Chatbot</Label>
            <Switch checked={chatbot} onCheckedChange={setChatbot} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button variant="outline" onClick={load}>
          Refresh
        </Button>
      </div>
    </div>
  );
}

