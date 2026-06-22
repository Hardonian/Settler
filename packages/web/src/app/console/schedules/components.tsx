"use client";

import { useCallback, useState } from "react";
import { Clock, Save, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { safeFetch } from "@/lib/safe-fetch";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScheduleJob {
  id: string;
  name: string;
  status: string;
  sourceAdapter: string;
  targetAdapter: string;
  scheduleCron: string | null;
  scheduleTimezone: string;
  emailDigest?: boolean;
  createdAt: string;
  updatedAt: string;
  lastExecution: {
    id: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CRON_PRESETS: { label: string; cron: string }[] = [
  { label: "Every hour", cron: "0 * * * *" },
  { label: "Every 6 hours", cron: "0 */6 * * *" },
  { label: "Daily at midnight", cron: "0 0 * * *" },
  { label: "Daily at 6 AM", cron: "0 6 * * *" },
  { label: "Weekly on Monday", cron: "0 0 * * 1" },
  { label: "Monthly on 1st", cron: "0 0 1 * *" },
];

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Rough human-readable description of a cron expression */
function describeCron(cron: string): string {
  const preset = CRON_PRESETS.find((p) => p.cron === cron);
  if (preset) return preset.label;

  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return cron;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  if (minute === "0" && hour === "*" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*")
    return "Every hour";
  if (minute === "0" && hour === "0" && dayOfMonth === "*" && month === "*" && dayOfWeek === "*")
    return "Daily at midnight";
  if (dayOfWeek !== "*" && dayOfMonth === "*") return `Weekly (cron: ${cron})`;
  if (dayOfMonth !== "*" && month === "*") return `Monthly (cron: ${cron})`;

  return cron;
}

/** Compute approximate next N run times from a cron expression (client-side rough estimate). */
function computeNextRuns(cron: string, timezone: string, count: number): Date[] {
  const runs: Date[] = [];
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return runs;

  const minuteField = parts[0] ?? "*";
  const hourField = parts[1] ?? "*";
  const dayOfMonthField = parts[2] ?? "*";
  const dayOfWeekField = parts[4] ?? "*";

  // Parse simple numeric or wildcard values
  const parseField = (field: string): number | null => {
    if (field === "*") return null;
    // Handle */N step syntax
    if (field.startsWith("*/")) return null;
    const num = parseInt(field, 10);
    return isNaN(num) ? null : num;
  };

  const targetMinute = parseField(minuteField);
  const targetHour = parseField(hourField);
  const targetDayOfMonth = parseField(dayOfMonthField);
  const targetDayOfWeek = parseField(dayOfWeekField);

  // Step values
  const hourStep =
    hourField.startsWith("*/") && hourField.length > 2 ? parseInt(hourField.slice(2), 10) : null;

  // Start from now, advance until we find `count` matching times
  const now = new Date();
  const cursor = new Date(now);
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1); // start from next minute

  let iterations = 0;
  const maxIterations = 525960; // ~1 year of minutes

  while (runs.length < count && iterations < maxIterations) {
    iterations++;

    const min = cursor.getMinutes();
    const hr = cursor.getHours();
    const dom = cursor.getDate();
    const dow = cursor.getDay(); // 0=Sun

    const minuteMatch = targetMinute === null || min === targetMinute;
    const hourMatch =
      targetHour !== null ? hr === targetHour : hourStep ? hr % hourStep === 0 : true;
    const domMatch = targetDayOfMonth === null || dom === targetDayOfMonth;
    const dowMatch = targetDayOfWeek === null || dow === targetDayOfWeek;

    if (minuteMatch && hourMatch && domMatch && dowMatch) {
      runs.push(new Date(cursor));
    }

    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return runs;
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diff = date.getTime() - now;
  if (diff < 0) return "just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `in ${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `in ${days}d ${hours % 24}h`;
}

// ---------------------------------------------------------------------------
// ScheduleConfigPanel
// ---------------------------------------------------------------------------

interface ScheduleConfigPanelProps {
  job: ScheduleJob;
  onSaved: () => void;
}

export function ScheduleConfigPanel({ job, onSaved }: ScheduleConfigPanelProps) {
  const [cronValue, setCronValue] = useState(job.scheduleCron ?? "");
  const [timezone, setTimezone] = useState(job.scheduleTimezone || "UTC");
  const [emailDigest, setEmailDigest] = useState(job.emailDigest ?? false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const nextRuns = cronValue.trim() ? computeNextRuns(cronValue.trim(), timezone, 3) : [];

  const handleSave = useCallback(async () => {
    if (!cronValue.trim()) {
      setError("Cron expression is required. Use a preset or enter a custom expression.");
      return;
    }
    setSaving(true);
    setError(null);

    const result = await safeFetch<{ id: string }>("/api/console/schedules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        scheduleCron: cronValue.trim(),
        scheduleTimezone: timezone,
        emailDigest,
      }),
    });

    setSaving(false);
    if (result.success) {
      onSaved();
    } else {
      setError(result.error?.message ?? "Failed to save schedule");
    }
  }, [cronValue, timezone, job.id, onSaved]);

  const handleRemove = useCallback(async () => {
    setRemoving(true);
    setError(null);

    const result = await safeFetch<{ id: string }>("/api/console/schedules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: job.id,
        scheduleCron: null,
      }),
    });

    setRemoving(false);
    if (result.success) {
      onSaved();
    } else {
      setError(result.error?.message ?? "Failed to remove schedule");
    }
  }, [job.id, onSaved]);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Schedule for {job.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Presets */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted-foreground">Quick presets</label>
          <div className="flex flex-wrap gap-2">
            {CRON_PRESETS.map((preset) => (
              <Button
                key={preset.cron}
                variant={cronValue === preset.cron ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCronValue(preset.cron);
                  setError(null);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom cron input */}
        <div className="space-y-1.5">
          <label
            htmlFor={`cron-${job.id}`}
            className="block text-xs font-medium text-muted-foreground"
          >
            Cron expression
          </label>
          <input
            id={`cron-${job.id}`}
            type="text"
            value={cronValue}
            onChange={(e) => {
              setCronValue(e.target.value);
              setError(null);
            }}
            placeholder="0 * * * *"
            className="input-field font-mono"
          />
          {cronValue.trim() && (
            <p className="text-xs text-muted-foreground">{describeCron(cronValue.trim())}</p>
          )}
        </div>

        {/* Timezone selector */}
        <div className="space-y-1.5">
          <label
            htmlFor={`tz-${job.id}`}
            className="block text-xs font-medium text-muted-foreground"
          >
            Timezone
          </label>
          <select
            id={`tz-${job.id}`}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="input-field"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Email Digest toggle */}
        <div className="space-y-1.5 flex items-center gap-2">
          <input
            id={`digest-${job.id}`}
            type="checkbox"
            checked={emailDigest}
            onChange={(e) => setEmailDigest(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          <label htmlFor={`digest-${job.id}`} className="text-sm font-medium text-foreground">
            Send email digest upon completion
          </label>
        </div>

        {/* Next runs preview */}
        {nextRuns.length > 0 && (
          <div className="space-y-1.5">
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPreview((v) => !v)}
            >
              Next 3 runs
              {showPreview ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>
            {showPreview && (
              <ul className="space-y-1 text-sm text-foreground">
                {nextRuns.map((run, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Badge variant="outline" size="sm">
                      {formatRelative(run)}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {run.toLocaleString()} ({timezone})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving || !cronValue.trim()}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
          {job.scheduleCron && (
            <Button variant="outline" size="sm" onClick={handleRemove} disabled={removing}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              {removing ? "Removing..." : "Remove Schedule"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
