/**
 * PolishControlPanel
 *
 * Preview-only UX panel for rapid final-stage UI iteration:
 * - Adjusts runtime UI tokens (density/radius/shadow)
 * - Toggles banner/widgets
 * - Uses local override (no deploy, no DB writes)
 */

"use client";

import { useMemo, useState } from "react";
import { useRuntimeUiConfig } from "@/lib/runtime-ui-config/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function PolishControlPanel() {
  const { config, source, setLocalOverride, clearLocalOverride } = useRuntimeUiConfig();

  const [density, setDensity] = useState(config.tokens.density);
  const [radiusScale, setRadiusScale] = useState(String(config.tokens.radiusScale));
  const [cardElevation, setCardElevation] = useState(config.tokens.cardElevation);

  const [bannerEnabled, setBannerEnabled] = useState(config.copy.announcement.enabled);
  const [bannerTone, setBannerTone] = useState(config.copy.announcement.tone);
  const [bannerMessage, setBannerMessage] = useState(config.copy.announcement.message);
  const [bannerLinkLabel, setBannerLinkLabel] = useState(config.copy.announcement.linkLabel || "");
  const [bannerLinkHref, setBannerLinkHref] = useState(config.copy.announcement.linkHref || "");

  const [chatbot, setChatbot] = useState(config.features.chatbot);
  const [floatingHelp, setFloatingHelp] = useState(config.features.floatingHelp);

  const parsedRadius = useMemo(() => {
    const n = Number(radiusScale);
    return Number.isFinite(n) ? n : config.tokens.radiusScale;
  }, [radiusScale, config.tokens.radiusScale]);

  function apply() {
    setLocalOverride({
      tokens: { density, radiusScale: parsedRadius, cardElevation },
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
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Polish Controls</CardTitle>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Config source: <span className="font-mono">{source}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Density</Label>
            <Select value={density} onValueChange={(v) => setDensity(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Radius scale (0.5–2.0)</Label>
            <Input
              value={radiusScale}
              onChange={(e) => setRadiusScale(e.target.value)}
              inputMode="decimal"
            />
          </div>

          <div className="space-y-2">
            <Label>Card elevation</Label>
            <Select value={cardElevation} onValueChange={(v) => setCardElevation(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Announcement banner</Label>
              <div className="text-xs text-slate-500">Shown globally from runtime config</div>
            </div>
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
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
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
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between">
            <div>
              <Label>Floating help</Label>
              <div className="text-xs text-slate-500">Global widget</div>
            </div>
            <Switch checked={floatingHelp} onCheckedChange={setFloatingHelp} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Chatbot</Label>
              <div className="text-xs text-slate-500">Global widget</div>
            </div>
            <Switch checked={chatbot} onCheckedChange={setChatbot} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={apply}>Apply local override</Button>
          <Button variant="outline" onClick={clearLocalOverride}>
            Clear local override
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
