/**
 * Operator Customization Studio — admin console presentation layout (tenant + user scoped).
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ADMIN_DASHBOARD_MODULE_REGISTRY } from "@/lib/operator-customization/registry";
import { OPERATOR_CUSTOMIZATION_PRESETS } from "@/lib/operator-customization/presets";
import type { CustomizationPatch, ModulePlacement, OperatorSurfaceCustomization } from "@/lib/operator-customization/schema";

type StudioPayload = {
  draft: OperatorSurfaceCustomization;
  published: OperatorSurfaceCustomization;
  publishedAt: string | null;
  draftUpdatedAt: string;
  registry: Array<(typeof ADMIN_DASHBOARD_MODULE_REGISTRY)[string]>;
  degraded?: { inference: string; message: string };
};

export default function OperatorCustomizationStudioPage() {
  const [payload, setPayload] = useState<StudioPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [proposal, setProposal] = useState<{
    id: string;
    patch: CustomizationPatch;
    rationale: string;
    inferenceMode: string;
  } | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<
    Array<{ kind: string; moduleId: string; evidence: { visitsInWindow: number }; message: string }>
  >([]);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    setLoadError(null);
    const res = await fetch("/api/admin/operator-customization", { credentials: "include" });
    if (!res.ok) {
      setLoadError(`Failed to load (${res.status})`);
      setPayload(null);
      return;
    }
    const json = (await res.json()) as StudioPayload;
    setPayload(json);
  }, []);

  const loadSuggestions = useCallback(async () => {
    const res = await fetch("/api/admin/operator-customization/suggestions", { credentials: "include" });
    if (!res.ok) return;
    const json = (await res.json()) as {
      suggestions: Array<{
        kind: string;
        moduleId: string;
        evidence: { visitsInWindow: number };
        message: string;
      }>;
    };
    setSuggestions(json.suggestions ?? []);
  }, []);

  useEffect(() => {
    void load();
    void loadSuggestions();
  }, [load, loadSuggestions]);

  const draft = payload?.draft;
  const published = payload?.published;

  const sortedDraft = useMemo(() => {
    if (!draft) return [];
    return [...draft.modules].sort((a, b) => a.order - b.order || a.moduleId.localeCompare(b.moduleId));
  }, [draft]);

  const diffSummary = useMemo(() => {
    if (!draft || !published) return [];
    const lines: string[] = [];
    const pubMap = new Map(published.modules.map((m) => [m.moduleId, m]));
    for (const m of draft.modules) {
      const p = pubMap.get(m.moduleId);
      if (!p) continue;
      if (p.enabled !== m.enabled) lines.push(`${m.moduleId}: enabled ${p.enabled} → ${m.enabled}`);
      if (p.order !== m.order) lines.push(`${m.moduleId}: order ${p.order} → ${m.order}`);
      if (p.titleOverride !== m.titleOverride) lines.push(`${m.moduleId}: title override changed`);
      if (p.helpOverride !== m.helpOverride) lines.push(`${m.moduleId}: help override changed`);
      if (JSON.stringify(p.thresholdOverrides) !== JSON.stringify(m.thresholdOverrides)) {
        lines.push(`${m.moduleId}: thresholds changed`);
      }
    }
    if (draft.operatingMode !== published.operatingMode) {
      lines.push(`operatingMode: ${published.operatingMode} → ${draft.operatingMode}`);
    }
    return lines;
  }, [draft, published]);

  async function saveDraft(next: OperatorSurfaceCustomization) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/operator-customization", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: next }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setLoadError(typeof b.error === "string" ? b.error : "save_failed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  function updatePlacement(moduleId: string, fn: (m: ModulePlacement) => ModulePlacement) {
    if (!draft) return;
    const next: OperatorSurfaceCustomization = {
      ...draft,
      modules: draft.modules.map((m) => (m.moduleId === moduleId ? fn(m) : m)),
    };
    setPayload((prev) => (prev ? { ...prev, draft: next } : prev));
    void saveDraft(next);
  }

  function moveModule(moduleId: string, dir: -1 | 1) {
    if (!draft) return;
    const orderSorted = [...draft.modules].sort((a, b) => a.order - b.order);
    const idx = orderSorted.findIndex((m) => m.moduleId === moduleId);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= orderSorted.length) return;
    const a = orderSorted[idx]!;
    const b = orderSorted[swap]!;
    const nextModules = draft.modules.map((m) => {
      if (m.moduleId === a.moduleId) return { ...m, order: b.order };
      if (m.moduleId === b.moduleId) return { ...m, order: a.order };
      return m;
    });
    void fetch("/api/admin/operator-customization/signals", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signalType: "layout_reorder", moduleId }),
    }).catch(() => {});
    void saveDraft({ ...draft, modules: nextModules });
  }

  async function applyPreset(presetId: string) {
    const preset = OPERATOR_CUSTOMIZATION_PRESETS.find((p) => p.id === presetId);
    if (!preset || !draft) return;
    const c = preset.customization();
    await saveDraft({ ...c, schemaVersion: "1" });
  }

  async function publish() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/operator-customization/publish", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setLoadError("publish_failed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function revertDraft() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/operator-customization/revert-draft", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setLoadError("revert_failed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function submitProposal() {
    setProposal(null);
    setProposalError(null);
    const res = await fetch("/api/admin/operator-customization/proposals", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: promptText }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setProposalError(typeof json.proposal?.rationale === "string" ? json.proposal.rationale : "rejected");
      return;
    }
    setProposal({
      id: json.proposal.id,
      patch: json.proposal.patch,
      rationale: json.proposal.rationale,
      inferenceMode: json.proposal.inferenceMode,
    });
  }

  async function applyProposal() {
    if (!proposal) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/operator-customization/proposals/${proposal.id}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        setLoadError("apply_proposal_failed");
        return;
      }
      setProposal(null);
      setPromptText("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!payload && !loadError) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Loading studio…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Operator Customization Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Presentation-only layout for the admin dashboard. Does not change reconciliation results, evidence, or run
          health semantics.
        </p>
        <p className="text-sm mt-2">
          <Link href="/admin" className="underline underline-offset-2">
            ← Back to dashboard
          </Link>
        </p>
      </div>

      {loadError ? (
        <p className="text-sm text-destructive" role="alert">
          {loadError}
        </p>
      ) : null}

      {payload?.degraded ? (
        <Card className="border-amber-500/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Inference posture</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{payload.degraded.message}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Draft vs published</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Published at:</span>{" "}
            {payload?.publishedAt ? new Date(payload.publishedAt).toLocaleString() : "never"}
          </p>
          <p>
            <span className="text-muted-foreground">Draft updated:</span>{" "}
            {payload?.draftUpdatedAt ? new Date(payload.draftUpdatedAt).toLocaleString() : "—"}
          </p>
          <div>
            <p className="font-medium mb-1">Change summary (draft vs published)</p>
            {diffSummary.length === 0 ? (
              <p className="text-muted-foreground">No differences.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-0.5 font-mono text-xs">
                {diffSummary.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" onClick={() => void publish()} disabled={busy || !draft}>
              Publish draft
            </Button>
            <Button size="sm" variant="outline" onClick={() => void revertDraft()} disabled={busy}>
              Revert draft to published
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void load()} disabled={busy}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Presets</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {OPERATOR_CUSTOMIZATION_PRESETS.map((p) => (
            <Button key={p.id} size="sm" variant="outline" onClick={() => void applyPreset(p.id)} disabled={busy}>
              {p.label}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active layout (draft)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedDraft.map((m) => {
            const def = ADMIN_DASHBOARD_MODULE_REGISTRY[m.moduleId];
            return (
              <div
                key={m.moduleId}
                className="border border-border rounded-lg p-3 space-y-2"
                tabIndex={0}
                aria-label={`Module ${m.moduleId}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{def?.defaultTitle ?? m.moduleId}</span>
                    {def?.locked ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Locked layout
                      </Badge>
                    ) : null}
                    <Badge variant="outline" className="text-[10px]">
                      {def?.truthClass?.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Order {m.order}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={`Move ${m.moduleId} up`}
                      onClick={() => moveModule(m.moduleId, -1)}
                      disabled={busy || def?.allowReorder === false}
                    >
                      ↑
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={`Move ${m.moduleId} down`}
                      onClick={() => moveModule(m.moduleId, 1)}
                      disabled={busy || def?.allowReorder === false}
                    >
                      ↓
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{def?.sourceOfTruthHint}</p>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={m.enabled}
                    disabled={busy || def?.allowDisable === false}
                    onCheckedChange={(v) => updatePlacement(m.moduleId, (x) => ({ ...x, enabled: v }))}
                    aria-label={`Enable ${m.moduleId}`}
                  />
                  <span className="text-sm">Visible</span>
                </div>
                {def?.allowTitleOverride ? (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor={`title-${m.moduleId}`}>
                      Title override
                    </label>
                    <Input
                      id={`title-${m.moduleId}`}
                      defaultValue={m.titleOverride ?? ""}
                      key={`${m.moduleId}-title-${m.titleOverride ?? ""}`}
                      placeholder={def.defaultTitle}
                      onBlur={(e) =>
                        updatePlacement(m.moduleId, (x) => ({
                          ...x,
                          titleOverride: e.target.value.trim() || undefined,
                        }))
                      }
                      disabled={busy}
                    />
                  </div>
                ) : null}
                {def?.allowHelpOverride ? (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor={`help-${m.moduleId}`}>
                      Help override
                    </label>
                    <Textarea
                      id={`help-${m.moduleId}`}
                      defaultValue={m.helpOverride ?? ""}
                      key={`${m.moduleId}-help-${m.helpOverride ?? ""}`}
                      placeholder={def.defaultHelp}
                      rows={2}
                      onBlur={(e) =>
                        updatePlacement(m.moduleId, (x) => ({
                          ...x,
                          helpOverride: e.target.value.trim() || undefined,
                        }))
                      }
                      disabled={busy}
                    />
                  </div>
                ) : null}
                {m.moduleId === "usage_warning" ? (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground" htmlFor={`thr-${m.moduleId}`}>
                      Usage warning threshold (volume)
                    </label>
                    <Input
                      id={`thr-${m.moduleId}`}
                      type="number"
                      defaultValue={m.thresholdOverrides?.usageWarningVolume ?? ""}
                      key={`${m.moduleId}-thr-${m.thresholdOverrides?.usageWarningVolume ?? ""}`}
                      placeholder="1000000"
                      onBlur={(e) => {
                        const n = e.target.value === "" ? undefined : Number(e.target.value);
                        updatePlacement(m.moduleId, (x) => ({
                          ...x,
                          thresholdOverrides:
                            n === undefined || Number.isNaN(n)
                              ? undefined
                              : { ...x.thresholdOverrides, usageWarningVolume: n },
                        }));
                      }}
                      disabled={busy}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt → proposal (review before apply)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
            placeholder='Try: "solo operator layout" or "hide activity feed"'
            aria-label="Customization request"
          />
          <Button size="sm" onClick={() => void submitProposal()} disabled={busy || !promptText.trim()}>
            Generate proposal
          </Button>
          {proposalError ? <p className="text-sm text-destructive">{proposalError}</p> : null}
          {proposal ? (
            <div className="border rounded-md p-3 space-y-2 text-sm">
              <p className="font-medium">Rationale</p>
              <p className="text-muted-foreground">{proposal.rationale}</p>
              <p className="text-xs text-muted-foreground">Mode: {proposal.inferenceMode}</p>
              <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                {JSON.stringify(proposal.patch, null, 2)}
              </pre>
              <Button size="sm" onClick={() => void applyProposal()} disabled={busy}>
                Apply to draft (not published)
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suggestions (usage-based)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground text-xs">
            Based on recorded module views (tenant-scoped). Dismiss is local to this browser session only.
          </p>
          {suggestions.filter((s) => !dismissed.has(s.moduleId)).length === 0 ? (
            <p className="text-muted-foreground">No suggestions right now.</p>
          ) : (
            suggestions
              .filter((s) => !dismissed.has(s.moduleId))
              .map((s) => (
                <div key={s.moduleId} className="border rounded-md p-3 flex flex-col sm:flex-row sm:justify-between gap-2">
                  <div>
                    <p>{s.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Evidence: {s.evidence.visitsInWindow} views (7d window)
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDismissed((prev) => new Set(prev).add(s.moduleId))}
                  >
                    Dismiss
                  </Button>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Module registry reference</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 font-mono">
          {(payload?.registry ?? []).map((r) => (
            <div key={r.id} className="border-b border-border/40 pb-2">
              <span className="font-semibold">{r.id}</span> · {r.truthClass} · {r.sourceOfTruthHint}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
