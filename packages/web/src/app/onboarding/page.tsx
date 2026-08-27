"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Shield, Database, ArrowLeft, ArrowRight } from "lucide-react";
import { BrandLockup } from "@/components/brand/BrandLockup";

const STEPS = [
  { id: 1, title: "Source Platform", description: "Where do your transactions originate?" },
  { id: 2, title: "Target Platform", description: "Where should transactions be matched?" },
  { id: 3, title: "Source Config", description: "Connect your source platform" },
  { id: 4, title: "Target Config", description: "Connect your target platform" },
  { id: 5, title: "Matching Rules", description: "How should transactions match?" },
];

const ADAPTER_CONFIG_FIELDS: Record<
  string,
  { name: string; label: string; type: string; placeholder: string; required: boolean }[]
> = {
  stripe: [
    {
      name: "apiKey",
      label: "Stripe Secret Key",
      type: "password",
      placeholder: "sk_test_...",
      required: true,
    },
    {
      name: "webhookSecret",
      label: "Webhook Secret (optional)",
      type: "password",
      placeholder: "whsec_...",
      required: false,
    },
  ],
  shopify: [
    {
      name: "apiKey",
      label: "Shopify API Key",
      type: "text",
      placeholder: "shpat_...",
      required: true,
    },
    {
      name: "shopDomain",
      label: "Shop Domain",
      type: "text",
      placeholder: "your-store.myshopify.com",
      required: true,
    },
    {
      name: "webhookSecret",
      label: "Webhook Secret (optional)",
      type: "password",
      placeholder: "...",
      required: false,
    },
  ],
  quickbooks: [
    { name: "clientId", label: "Client ID", type: "text", placeholder: "...", required: true },
    {
      name: "clientSecret",
      label: "Client Secret",
      type: "password",
      placeholder: "...",
      required: true,
    },
    { name: "realmId", label: "Realm ID", type: "text", placeholder: "...", required: true },
    {
      name: "accessToken",
      label: "Access Token",
      type: "password",
      placeholder: "...",
      required: true,
    },
    {
      name: "refreshToken",
      label: "Refresh Token",
      type: "password",
      placeholder: "...",
      required: true,
    },
  ],
};

interface Rule {
  field: string;
  type: string;
  description: string;
  tolerance?: number;
  days?: number;
  threshold?: number;
}

const DEFAULT_RULES: Rule[] = [
  { field: "transaction_id", type: "exact", description: "Match transaction IDs exactly" },
  { field: "amount", type: "exact", tolerance: 0.01, description: "Match amounts within $0.01" },
];

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adapters, setAdapters] = useState<Array<{ id: string; name: string }>>([]);
  const [suggestedRules, setSuggestedRules] = useState<Rule[]>(DEFAULT_RULES);
  const [completed, setCompleted] = useState(false);
  const [jobConfig, setJobConfig] = useState<Record<string, unknown> | null>(null);

  // Fetch adapters on mount
  useEffect(() => {
    fetch("/api/cli/wizard/steps")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          const sourceStep = data.data.find((s: any) => s.step === 1);
          if (sourceStep?.options) {
            setAdapters(sourceStep.options);
          }
        }
      })
      .catch(() => {
        // Fallback adapters
        setAdapters([
          { id: "stripe", name: "Stripe" },
          { id: "shopify", name: "Shopify" },
          { id: "quickbooks", name: "QuickBooks" },
        ]);
      });
  }, []);

  // Update suggested rules when source/target change
  useEffect(() => {
    const source = answers.sourceAdapter as string;
    const target = answers.targetAdapter as string;
    if (source && target && source === "shopify" && target === "stripe") {
      setSuggestedRules([
        {
          field: "order_id",
          type: "exact",
          description: "Match Shopify order ID with Stripe payment metadata",
        },
        {
          field: "amount",
          type: "exact",
          tolerance: 0.01,
          description: "Match amounts within $0.01 tolerance",
        },
        {
          field: "date",
          type: "range",
          days: 1,
          description: "Allow 1 day difference for processing delays",
        },
      ]);
    } else {
      setSuggestedRules(DEFAULT_RULES);
    }
  }, [answers.sourceAdapter, answers.targetAdapter]);

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final step - generate job config
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cli/wizard/generate-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to generate job config");

      setJobConfig(data.data?.jobConfig || null);
      setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!answers.sourceAdapter) {
          setError("Please select a source platform");
          return false;
        }
        break;
      case 2:
        if (!answers.targetAdapter) {
          setError("Please select a target platform");
          return false;
        }
        if (answers.sourceAdapter === answers.targetAdapter) {
          setError("Source and target platforms must be different");
          return false;
        }
        break;
      case 3: {
        const sourceAdapter = answers.sourceAdapter as string;
        const sourceConfig = answers.sourceConfig as Record<string, unknown>;
        const fields = ADAPTER_CONFIG_FIELDS[sourceAdapter] || [];
        for (const field of fields) {
          if (field.required && (!sourceConfig || !sourceConfig[field.name])) {
            setError(`${field.label} is required`);
            return false;
          }
        }
        break;
      }
      case 4: {
        const targetAdapter = answers.targetAdapter as string;
        const targetConfig = answers.targetConfig as Record<string, unknown>;
        const fields = ADAPTER_CONFIG_FIELDS[targetAdapter] || [];
        for (const field of fields) {
          if (field.required && (!targetConfig || !targetConfig[field.name])) {
            setError(`${field.label} is required`);
            return false;
          }
        }
        break;
      }
      case 5:
        if (!answers.rules || (answers.rules as unknown[]).length === 0) {
          setError("At least one matching rule is required");
          return false;
        }
        break;
    }
    setError(null);
    return true;
  };

  const updateAnswer = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const updateNestedAnswer = (parent: string, key: string, value: unknown) => {
    setAnswers((prev) => ({
      ...prev,
      [parent]: { ...((prev[parent] as Record<string, unknown>) || {}), [key]: value },
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SelectStep
            label="Source Platform"
            placeholder="Select platform..."
            value={answers.sourceAdapter as string}
            onChange={(v) => updateAnswer("sourceAdapter", v)}
            options={adapters}
          />
        );
      case 2:
        return (
          <SelectStep
            label="Target Platform"
            placeholder="Select platform..."
            value={answers.targetAdapter as string}
            onChange={(v) => updateAnswer("targetAdapter", v)}
            options={adapters.filter((a) => a.id !== answers.sourceAdapter)}
          />
        );
      case 3:
        return (
          <ConfigStep
            title={`Configure ${adapters.find((a) => a.id === answers.sourceAdapter)?.name || "Source"}`}
            adapterId={answers.sourceAdapter as string}
            config={answers.sourceConfig as Record<string, unknown>}
            onChange={(key, value) => updateNestedAnswer("sourceConfig", key, value)}
          />
        );
      case 4:
        return (
          <ConfigStep
            title={`Configure ${adapters.find((a) => a.id === answers.targetAdapter)?.name || "Target"}`}
            adapterId={answers.targetAdapter as string}
            config={answers.targetConfig as Record<string, unknown>}
            onChange={(key, value) => updateNestedAnswer("targetConfig", key, value)}
          />
        );
      case 5:
        return (
          <RulesStep
            rules={(answers.rules as typeof DEFAULT_RULES) || []}
            suggestedRules={suggestedRules}
            onChange={(rules) => updateAnswer("rules", rules)}
          />
        );
      default:
        return null;
    }
  };

  if (completed && jobConfig) {
    return (
      <WizardLayout
        currentStep={5}
        title="Job Configuration Ready"
        subtitle="Your reconciliation job is configured. Copy the CLI command to create it."
      >
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Generated Job Config</CardTitle>
            <CardDescription>Review and run the command below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="bg-slate-950 p-4 rounded-lg text-sm overflow-x-auto">
              {JSON.stringify(jobConfig, null, 2)}
            </pre>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(jobConfig, null, 2));
                alert("Job config copied to clipboard!");
              }}
              className="w-full"
            >
              Copy Config
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </WizardLayout>
    );
  }

  return (
    <WizardLayout
      currentStep={currentStep}
      title={STEPS[currentStep - 1]?.title ?? ""}
      subtitle={STEPS[currentStep - 1]?.description ?? ""}
      onBack={handleBack}
      onNext={handleNext}
      loading={loading}
      error={error}
      canGoBack={currentStep > 1}
      isLastStep={currentStep === 5}
    >
      {renderStep()}
    </WizardLayout>
  );
}

function WizardLayout({
  currentStep,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  loading = false,
  error = null,
  canGoBack = false,
  isLastStep = false,
}: {
  currentStep: number;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  loading?: boolean;
  error?: string | null;
  canGoBack?: boolean;
  isLastStep?: boolean;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex-1 max-w-2xl mx-auto py-16 px-6 lg:px-12">
        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm transition-all ${
                    index + 1 < currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : index + 1 === currentStep
                        ? "border-primary text-primary bg-white"
                        : "border-slate-300 text-slate-400 bg-white"
                  }`}
                >
                  {index + 1 < currentStep ? <Check size={16} /> : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`hidden lg:block w-20 h-1 mx-2 transition-colors ${
                      index + 1 < currentStep ? "bg-primary" : "bg-slate-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="mt-4 h-2" />
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block mb-6">
            <BrandLockup orientation="stacked" className="max-w-[220px]" priority />
          </Link>
          <h1 className="text-3xl font-bold italic tracking-tight">{title}</h1>
          <p className="mt-2 text-slate-600 font-medium">{subtitle}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
            <Shield className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Wizard Content */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-8">{children}</CardContent>
        </Card>

        {/* Navigation */}
        {(onNext || onBack) && (
          <div className="mt-8 flex justify-between">
            {canGoBack && onBack && (
              <Button variant="outline" onClick={onBack} disabled={loading}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {onNext && (
              <Button onClick={onNext} disabled={loading} className="ml-auto" size="lg">
                {isLastStep ? "Generate Job Config" : "Continue"}
                {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
                {loading && (
                  <span className="ml-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SelectStep({
  label: _label,
  placeholder: _placeholder,
  value,
  onChange,
  options,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`relative p-6 rounded-xl border-2 transition-all text-left ${
              value === option.id
                ? "border-primary bg-primary/5"
                : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  value === option.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                <Database size={24} />
              </div>
              <div>
                <p className="font-semibold text-lg">{option.name}</p>
                <p className="text-sm text-slate-500">
                  Connect your {option.name.toLowerCase()} account
                </p>
              </div>
              {value === option.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check size={14} />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfigStep({
  title,
  adapterId,
  config,
  onChange,
}: {
  title: string;
  adapterId: string;
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  const fields = ADAPTER_CONFIG_FIELDS[adapterId] || [];

  return (
    <div className="space-y-6">
      <p className="text-slate-600">
        Enter your {title.toLowerCase()} credentials. These are stored securely and never exposed.
      </p>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label
              htmlFor={field.name}
              className="text-xs font-bold uppercase tracking-widest text-slate-500"
            >
              {field.label} {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={(config?.[field.name] as string) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              required={field.required}
              className="h-12 border-slate-300 focus:border-primary focus:ring-primary/20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesStep({
  rules,
  suggestedRules,
  onChange,
}: {
  rules: Rule[];
  suggestedRules: Rule[];
  onChange: (rules: Rule[]) => void;
}) {
  const [newRule, setNewRule] = useState({
    field: "",
    type: "exact",
    tolerance: 0.01,
    days: 1,
    description: "",
  });

  const addRule = () => {
    if (!newRule.field || !newRule.description) return;
    const { tolerance, days, ...rest } = newRule;
    const rule: Rule = {
      ...rest,
      ...(newRule.type === "exact" ? { tolerance } : {}),
      ...(newRule.type === "range" ? { days } : {}),
    };
    onChange([...rules, rule]);
    setNewRule({ field: "", type: "exact", tolerance: 0.01, days: 1, description: "" });
  };

  const removeRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-4">Configured Rules ({rules.length})</h3>
        {rules.length === 0 ? (
          <p className="text-slate-500 text-sm">
            No rules configured yet. Add at least one rule to continue.
          </p>
        ) : (
          <div className="space-y-3">
            {rules.map((rule, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg"
              >
                <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{rule.field}</p>
                  <p className="text-sm text-slate-500">
                    {rule.type === "exact"
                      ? `Exact match${rule.tolerance ? ` (±${rule.tolerance})` : ""}`
                      : rule.type === "fuzzy"
                        ? `Fuzzy match (threshold: ${rule.threshold})`
                        : `Range match (±${rule.days} day${rule.days !== 1 ? "s" : ""})`}
                    — {rule.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRule(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="font-semibold mb-4">Add Rule</h3>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Field
              </Label>
              <Input
                placeholder="e.g., order_id, amount, date"
                value={newRule.field}
                onChange={(e) => setNewRule({ ...newRule, field: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Type
              </Label>
              <Select
                value={newRule.type}
                onValueChange={(v) => setNewRule({ ...newRule, type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exact">Exact</SelectItem>
                  <SelectItem value="fuzzy">Fuzzy</SelectItem>
                  <SelectItem value="range">Range (date/amount)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Description
              </Label>
              <Input
                placeholder="Why this rule?"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
              />
            </div>
          </div>

          {newRule.type === "exact" && (
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Tolerance (optional)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.01"
                value={newRule.tolerance?.toString() || ""}
                onChange={(e) =>
                  setNewRule({ ...newRule, tolerance: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          )}

          {newRule.type === "range" && (
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Days Tolerance
              </Label>
              <Input
                type="number"
                min="1"
                placeholder="1"
                value={newRule.days?.toString() || ""}
                onChange={(e) => setNewRule({ ...newRule, days: parseInt(e.target.value) || 1 })}
              />
            </div>
          )}

          <Button onClick={addRule} disabled={!newRule.field || !newRule.description}>
            Add Rule
          </Button>
        </div>
      </div>

      {suggestedRules.length > 0 && (
        <div className="border-t border-slate-200 pt-6">
          <h3 className="font-semibold mb-4">Suggested Rules</h3>
          <div className="space-y-2">
            {suggestedRules.map((rule, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="w-full justify-start gap-3"
                onClick={() => {
                  const newR: Rule = { ...rule };
                  if (newR.type === "exact") delete newR.days;
                  if (newR.type === "range") delete newR.tolerance;
                  onChange([...rules, newR]);
                }}
              >
                <Zap className="h-4 w-4 text-primary" />
                <span>
                  {rule.field} — {rule.type}
                  {rule.tolerance ? ` (±${rule.tolerance})` : rule.days ? ` (±${rule.days}d)` : ""}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
