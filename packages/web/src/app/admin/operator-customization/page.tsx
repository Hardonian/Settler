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
import type {
  CustomizationPatch,
  ModulePlacement,
  OperatorSurfaceCustomization,
} from "@/lib/operator-customization/schema";

const PREMIUM_PRESET_IDS = new Set(["buyer_demo", "exception_ops"]);

type StudioPayload = {
  draft: OperatorSurfaceCustomization;
  published: OperatorSurfaceCustomization;
  publishedAt: string | null;
  draftUpdatedAt: string;
  registry: Array<(typeof ADMIN_DASHBOARD_MODULE_REGISTRY)[string]>;
  tenant?: { id: string; slug: string; multiTenantEnvironment: boolean };
  entitlements?: {
    planCode: string;
    capabilities: Record<string, boolean>;
  };
  degraded?: { inference: string; message: string; code?: string };
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
    explanationEvidence?: Record<string, unknown>;
  } | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<
    Array<{
      kind: string;
      moduleId: string;
      evidence: { visitsInWindow: number; windowHours?: number };
      message: string;
    }>
  >([]);
  const [tenantOptions, setTenantOptions] = useState<
    Array<{ id: string; slug: string; name: string }>
  >([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const tenantQuery = useMemo(
    () => (selectedTenantId ? `?tenantId=${encodeURIComponent(selectedTenantId)}` : ""),
    [selectedTenantId]
  );

  const persistBody = useCallback(
    (extra: Record<string, unknown> = {}) =>
      selectedTenantId ? { tenantId: selectedTenantId, ...extra } : { ...extra },
    [selectedTenantId]
  );

  const loadTenants = useCallback(async () => {
    const res = await fetch("/api/admin/operator-customization/tenants", {
      credentials: "include",
    });
    if (!res.ok) return;
    const json = (await res.json()) as { items: Array<{ id: string; slug: string; name: string }> };
    const items = json.items ?? [];
    setTenantOptions(items);
    if (items.length === 1) {
      setSelectedTenantId(items[0]!.id);
    }
  }, []);

  const load = useCallback(async () => {
    setLoadError(null);
    if (tenantOptions.length > 1 && !selectedTenantId) {
      setPayload(null);
      return;
    }
    const res = await fetch(`/api/admin/operator-customization${tenantQuery}`, {
      credentials: "include",
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        message?: string;
        activeTenantCount?: number;
      };
      const msg =
        b.message ||
        (b.code === "ambiguous_tenant"
          ? "Select a workspace below — multiple active tenants require an explicit target."
          : typeof b.error === "string"
            ? b.error
            : `Failed to load (${res.status})`);
      setLoadError(msg);
      setPayload(null);
      return;
    }
    const json = (await res.json()) as StudioPayload;
    setPayload(json);
    if (json.tenant?.id) {
      setSelectedTenantId(json.tenant.id);
    }
  }, [tenantQuery, tenantOptions.length, selectedTenantId]);

  const loadSuggestions = useCallback(async () => {
    if (tenantOptions.length > 1 && !selectedTenantId) return;
    const res = await fetch(`/api/admin/operator-customization/suggestions${tenantQuery}`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const json = (await res.json()) as {
      suggestions: Array<{
        kind: string;
        moduleId: string;
        evidence: { visitsInWindow: number; windowHours?: number };
        message: string;
      }>;
    };
    setSuggestions(json.suggestions ?? []);
  }, [tenantQuery, tenantOptions.length, selectedTenantId]);

  useEffect(() => {
    void loadTenants();
  }, [loadTenants]);

  useEffect(() => {
    if (tenantOptions.length > 1 && !selectedTenantId) return;
    void load();
    void loadSuggestions();
  }, [load, loadSuggestions, tenantOptions.length, selectedTenantId]);

  const draft = payload?.draft;
  const published = payload?.published;
  const advancedOk = payload?.entitlements?.capabilities?.advanced_presets === true;

  const sortedDraft = useMemo(() => {
    if (!draft) return [];
    return [...draft.modules].sort(
      (a, b) => a.order - b.order || a.moduleId.localeCompare(b.moduleId)
    );
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
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/admin/operator-customization", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(persistBody({ draft: next })),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
          message?: string;
          planCode?: string;
        };
        setSaveStatus("error");
        setLoadError(
          b.code === "advanced_presets_require_plan"
            ? `This preset requires a Growth (or higher) plan for this workspace (current: ${b.planCode ?? "unknown"}).`
            : b.message || (typeof b.error === "string" ? b.error : "save_failed")
        );
        return;
      }
      setSaveStatus("saved");
      setLoadError(null);
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
      body: JSON.stringify(persistBody({ signalType: "layout_reorder", moduleId })),
    }).catch(() => {});
    void saveDraft({ ...draft, modules: nextModules });
  }

  async function applyPreset(presetId: string) {
    if (!advancedOk && PREMIUM_PRESET_IDS.has(presetId)) {
      setLoadError(
        "That preset is gated to Growth+ on the workspace billing plan. Default and Solo operator remain available on Starter."
      );
      return;
    }
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
        body: JSON.stringify(persistBody()),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { code?: string; planCode?: string };
        setLoadError(
          b.code === "advanced_presets_require_plan"
            ? `Cannot publish: draft references a preset that requires Growth+ (plan: ${b.planCode ?? "unknown"}).`
            : "publish_failed"
        );
        return;
      }
      setLoadError(null);
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
        body: JSON.stringify(persistBody()),
      });
      if (!res.ok) {
        setLoadError("revert_failed");
        return;
      }
      setLoadError(null);
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
      body: JSON.stringify(persistBody({ request: promptText })),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setProposalError(
        typeof json.proposal?.rationale === "string" ? json.proposal.rationale : "rejected"
      );
      return;
    }
    setProposal({
      id: json.proposal.id,
      patch: json.proposal.patch,
      rationale: json.proposal.rationale,
      inferenceMode: json.proposal.inferenceMode,
      explanationEvidence: json.proposal.explanationEvidence,
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
        body: JSON.stringify(persistBody()),
      });
      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { code?: string };
        setLoadError(
          b.code === "advanced_presets_require_plan"
            ? "Proposal would apply a Growth+ preset — upgrade the workspace plan or edit the draft."
            : "apply_proposal_failed"
        );
        return;
      }
      setProposal(null);
      setPromptText("");
      setLoadError(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function dismissSuggestion(moduleId: string) {
    const res = await fetch("/api/admin/operator-customization/suggestions/dismiss", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        persistBody({
          surface: "admin_dashboard",
          suggestionKind: "pin_module",
          suggestionKey: moduleId,
          reasonCategory: "operator_dismissed",
        })
      ),
    });
    if (res.ok) {
      await loadSuggestions();
    }
  }

  const awaitingTenantPick = tenantOptions.length > 1 && !selectedTenantId;

  if (!payload && !loadError && !awaitingTenantPick) {
    return (
      <div className="p-8" data-testid="operator-customization-loading">
        <p className="text-muted-foreground">Loading studio…</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl space-y-6" data-testid="operator-customization-studio">
      <div>
        <h1 className="text-2xl font-bold">Operator Customization Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Presentation-only layout for the admin dashboard. Does not change reconciliation results,
          evidence, or run health semantics. Draft saves are persisted; publish makes the layout
          live for your operator session on this workspace.
        </p>
        <p className="text-sm mt-2">
          <Link href="/admin" className="underline underline-offset-2">
            ← Back to dashboard
          </Link>
        </p>
      </div>

      {tenantOptions.length > 1 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Workspace target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground text-xs">
              Multiple active tenants exist. Customization writes are scoped to the workspace you
              select.
            </p>
            <label className="sr-only" htmlFor="tenant-select">
              Workspace
            </label>
            <select
              id="tenant-select"
              data-testid="operator-customization-tenant-select"
              className="border rounded-md px-3 py-2 text-sm bg-background"
              value={selectedTenantId ?? ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setSelectedTenantId(v);
                setPayload(null);
                setLoadError(null);
              }}
            >
              <option value="">Select workspace…</option>
              {tenantOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      ) : null}

      {payload?.tenant ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid="operator-customization-tenant-context"
        >
          Workspace: <span className="font-mono">{payload.tenant.slug}</span>
          {payload.entitlements ? (
            <>
              {" "}
              · Plan: <span className="font-mono">{payload.entitlements.planCode}</span>
            </>
          ) : null}
        </p>
      ) : null}

      {loadError ? (
        <p
          className="text-sm text-destructive"
          role="alert"
          data-testid="operator-customization-error"
        >
          {loadError}
        </p>
      ) : null}

      {saveStatus !== "idle" ? (
        <p
          className="text-xs text-muted-foreground"
          data-testid="operator-customization-save-status"
        >
          {saveStatus === "saving"
            ? "Saving draft…"
            : saveStatus === "saved"
              ? "Draft saved (server)"
              : "Save failed"}
        </p>
      ) : null}

      {awaitingTenantPick ? (
        <p className="text-sm text-muted-foreground">Choose a workspace to load customization.</p>
      ) : null}

      {payload?.degraded ? (
        <Card className="border-amber-500/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Advisory proposals</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>{payload.degraded.message}</p>
            {payload.degraded.code ? (
              <p className="text-xs font-mono">Code: {payload.degraded.code}</p>
            ) : null}
          </CardContent>
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
            <Button
              size="sm"
              onClick={() => void publish()}
              disabled={busy || !draft || awaitingTenantPick}
              data-testid="operator-customization-publish"
            >
              Publish draft
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void revertDraft()}
              disabled={busy || awaitingTenantPick}
            >
              Revert draft to published
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => void load()}
              disabled={busy || awaitingTenantPick}
            >
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
          {OPERATOR_CUSTOMIZATION_PRESETS.map((p) => {
            const gated = PREMIUM_PRESET_IDS.has(p.id) && !advancedOk;
            return (
              <Button
                key={p.id}
                size="sm"
                variant="outline"
                onClick={() => void applyPreset(p.id)}
                disabled={busy || gated}
                title={gated ? "Requires Growth+ plan for this workspace" : undefined}
                data-testid={`operator-customization-preset-${p.id}`}
              >
                {p.label}
                {gated ? (
                  <Badge variant="secondary" className="ml-2 text-[9px]">
                    Growth+
                  </Badge>
                ) : null}
              </Button>
            );
          })}
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
                    onCheckedChange={(v) =>
                      updatePlacement(m.moduleId, (x) => ({ ...x, enabled: v }))
                    }
                    aria-label={`Enable ${m.moduleId}`}
                  />
                  <span className="text-sm">Visible</span>
                </div>
                {def?.allowTitleOverride ? (
                  <div className="space-y-1">
                    <label
                      className="text-xs text-muted-foreground"
                      htmlFor={`title-${m.moduleId}`}
                    >
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
          <CardTitle className="text-base">Rules-based proposal (review before apply)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Advisory only: deterministic pattern match to a patch. Does not auto-publish; does not
            change reconciliation truth.
          </p>
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
            placeholder='Try: "solo operator layout" or "hide activity feed"'
            aria-label="Customization request"
            data-testid="operator-customization-proposal-input"
          />
          <Button
            size="sm"
            onClick={() => void submitProposal()}
            disabled={busy || !promptText.trim() || awaitingTenantPick}
            data-testid="operator-customization-proposal-generate"
          >
            Generate proposal
          </Button>
          {proposalError ? <p className="text-sm text-destructive">{proposalError}</p> : null}
          {proposal ? (
            <div
              className="border rounded-md p-3 space-y-2 text-sm"
              data-testid="operator-customization-proposal-panel"
            >
              <p className="font-medium">Rationale</p>
              <p className="text-muted-foreground">{proposal.rationale}</p>
              <p className="text-xs text-muted-foreground">Mode: {proposal.inferenceMode}</p>
              {proposal.explanationEvidence ? (
                <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                  {JSON.stringify(proposal.explanationEvidence, null, 2)}
                </pre>
              ) : null}
              <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                {JSON.stringify(proposal.patch, null, 2)}
              </pre>
              <Button
                size="sm"
                onClick={() => void applyProposal()}
                disabled={busy}
                data-testid="operator-customization-proposal-apply"
              >
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
            Based on recorded module views (tenant-scoped). Dismiss is stored for this workspace and
            your operator account (not session-only).
          </p>
          {suggestions.length === 0 ? (
            <p className="text-muted-foreground">No suggestions right now.</p>
          ) : (
            suggestions.map((s) => (
              <div
                key={s.moduleId}
                className="border rounded-md p-3 flex flex-col sm:flex-row sm:justify-between gap-2"
                data-testid={`operator-customization-suggestion-${s.moduleId}`}
              >
                <div>
                  <p>{s.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Evidence: {s.evidence.visitsInWindow} views (7d window)
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void dismissSuggestion(s.moduleId)}
                  data-testid={`operator-customization-suggestion-dismiss-${s.moduleId}`}
                >
                  Dismiss (saved)
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
