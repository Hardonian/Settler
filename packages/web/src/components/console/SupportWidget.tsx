/**
 * Tenant-scoped support intake — canonical POST /api/v1/support/intake.
 */

"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, CheckCircle2, AlertCircle } from "lucide-react";
import { ConsoleErrorBoundary } from "./ErrorBoundary";
import { SUPPORT_ISSUE_CATEGORY_LABELS, type SupportIssueCategory } from "@settler/types";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORY_ENTRIES = Object.entries(SUPPORT_ISSUE_CATEGORY_LABELS) as Array<
  [SupportIssueCategory, string]
>;

export interface SupportWidgetProps {
  /** Current console path for correlation (stored verbatim on the intake record). */
  defaultRoute?: string;
  /** When opened from run detail, pre-fill run UUID for proof-context attachment. */
  defaultRunId?: string;
  /** When opened from an exception detail, pre-fill exception UUID for family-context attachment. */
  defaultExceptionId?: string;
}

export function SupportWidget({
  defaultRoute,
  defaultRunId = "",
  defaultExceptionId = "",
}: SupportWidgetProps) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [runId, setRunId] = useState(defaultRunId);
  const [exceptionId, setExceptionId] = useState(defaultExceptionId);
  const [category, setCategory] = useState<SupportIssueCategory>("run_failure");
  const [moduleHint, setModuleHint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const contextBundle = useMemo(() => {
    const lines = [
      "=== Settler support context bundle (paste into email or ticket) ===",
      `Category: ${SUPPORT_ISSUE_CATEGORY_LABELS[category]} (${category})`,
      subject.trim() ? `Title: ${subject.trim()}` : "Title: (none)",
      runId.trim() ? `Run UUID: ${runId.trim()}` : "Run UUID: (not provided)",
      exceptionId.trim()
        ? `Exception UUID: ${exceptionId.trim()}`
        : "Exception UUID: (not provided)",
      moduleHint.trim() ? `Module hint: ${moduleHint.trim()}` : "Module hint: (none)",
      defaultRoute?.trim() ? `Console route: ${defaultRoute.trim()}` : "Console route: (none)",
      "",
      "Details:",
      description.trim() || "(draft — add at least 20 characters before submit)",
      "",
      "Note: Submitting the form also records tenant-scoped intake with audit attribution.",
    ];
    return lines.join("\n");
  }, [category, subject, runId, exceptionId, moduleHint, description, defaultRoute]);

  const copyBundle = async () => {
    setCopyFeedback(null);
    try {
      await navigator.clipboard.writeText(contextBundle);
      setCopyFeedback("Copied to clipboard");
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch {
      setCopyFeedback("Copy failed — select the text manually");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const summary = subject.trim();
    const body = description.trim();

    if (!body && !summary) {
      setErrorMessage("Enter a description (or a short title plus details).");
      return;
    }

    const fullDescription = summary ? `${summary}\n\n${body || "(no additional detail)"}` : body;

    if (fullDescription.length < 20) {
      setErrorMessage("Description must be at least 20 characters including the title.");
      return;
    }

    if (fullDescription.length > 5000) {
      setErrorMessage("Combined title and description must be 5000 characters or less.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/support/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description: fullDescription,
          run_id: runId.trim() || undefined,
          exception_id: exceptionId.trim() || undefined,
          route: defaultRoute?.trim() || undefined,
          module: moduleHint.trim() || undefined,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        submission_id?: string;
        code?: string;
        message?: string;
      };

      if (!res.ok) {
        setErrorMessage(
          data.message ||
            (typeof data.code === "string" ? data.code : "Support intake was not accepted.")
        );
        return;
      }

      setSubmissionId(typeof data.submission_id === "string" ? data.submission_id : null);
      setSubmitted(true);
      setSubject("");
      setDescription("");
      setRunId(defaultRunId);
      setExceptionId(defaultExceptionId);
      setModuleHint("");
      setCategory("run_failure");
    } catch (error: unknown) {
      console.error("Support intake failed:", error);
      setErrorMessage("Network error. Check connectivity and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500 mx-auto" />
          <h3 className="text-lg font-semibold">Intake recorded</h3>
          <p className="text-muted-foreground text-sm">
            Your issue is queued with tenant scope and audit attribution.
            {submissionId ? (
              <>
                {" "}
                Reference:{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">{submissionId}</code>
              </>
            ) : null}
          </p>
          <Button type="button" onClick={() => setSubmitted(false)} variant="outline">
            Submit another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <ConsoleErrorBoundary>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              aria-hidden="true"
            />
            Operator support intake
          </CardTitle>
          <CardDescription>
            Evidence-oriented categories. Optional run and exception UUIDs attach canonical proof
            and family-memory context when they exist for this tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="support-subject">Short title (optional)</Label>
              <Input
                id="support-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Export fails on run XYZ"
                maxLength={200}
              />
            </div>

            <div>
              <Label htmlFor="support-category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as SupportIssueCategory)}
              >
                <SelectTrigger id="support-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ENTRIES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="support-run-id">Run ID (optional)</Label>
              <Input
                id="support-run-id"
                value={runId}
                onChange={(e) => setRunId(e.target.value)}
                placeholder="UUID of the reconciliation run"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Non-UUID run references are kept in the text only; UUIDs link operator run context
                when available.
              </p>
            </div>

            <div>
              <Label htmlFor="support-exception-id">Exception ID (optional)</Label>
              <Input
                id="support-exception-id"
                value={exceptionId}
                onChange={(e) => setExceptionId(e.target.value)}
                placeholder="UUID of the exception"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground mt-1">
                UUIDs attach canonical exception family context. Non-UUID references are preserved
                in the ticket, but cannot be enriched automatically.
              </p>
            </div>

            <div>
              <Label htmlFor="support-module">Component / module hint (optional)</Label>
              <Input
                id="support-module"
                value={moduleHint}
                onChange={(e) => setModuleHint(e.target.value)}
                placeholder="e.g. exports, exceptions, replay"
                maxLength={120}
              />
            </div>

            <div>
              <Label htmlFor="support-description">Details (required, min 20 characters)</Label>
              <Textarea
                id="support-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What you expected, what happened, timestamps, and any error codes…"
                rows={6}
                required
                minLength={20}
                maxLength={5000}
              />
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="support-context-bundle" className="text-sm">
                  Copy-paste context bundle
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={() => void copyBundle()}>
                  Copy bundle
                </Button>
              </div>
              {copyFeedback ? (
                <p className="text-xs text-muted-foreground">{copyFeedback}</p>
              ) : null}
              <Textarea
                id="support-context-bundle"
                readOnly
                value={contextBundle}
                rows={10}
                className="font-mono text-xs"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting…" : "Submit support intake"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </ConsoleErrorBoundary>
  );
}
