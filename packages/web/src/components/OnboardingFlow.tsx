"use client";

import { useState, useEffect, useRef } from "react";
import { SettlerClient } from "@settler/sdk";

interface OnboardingFlowProps {
  apiKey: string;
  onComplete: () => void;
}

interface AnalyticsEvent {
  event: string;
  timestamp: number;
  step?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

// Analytics tracking utility
const trackEvent = (event: AnalyticsEvent) => {
  // Send to APM/Analytics system
  if (typeof window !== "undefined") {
    // In production, this would send to your APM system (e.g., Sentry, Datadog, etc.)
    const analyticsEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || "/api/analytics";
    
    fetch(analyticsEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...event,
        userId: localStorage.getItem("userId") || "anonymous",
        sessionId: sessionStorage.getItem("sessionId") || crypto.randomUUID(),
      }),
    }).catch((err) => {
      console.warn("Analytics tracking failed:", err);
    });
  }
};

export default function OnboardingFlow({ apiKey, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [client] = useState(() => new SettlerClient({ apiKey }));
  const [formData, setFormData] = useState({
    name: "",
    sourceAdapter: "shopify",
    targetAdapter: "stripe",
    sourceConfig: {} as Record<string, string>,
    targetConfig: {} as Record<string, string>,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Analytics tracking
  const startTimeRef = useRef<number>(Date.now());
  const stepStartTimeRef = useRef<number>(Date.now());
  const ahaMomentReachedRef = useRef<boolean>(false);

  const steps = [
    { number: 1, title: "Job Details", description: "Name your reconciliation job" },
    { number: 2, title: "Source System", description: "Configure your source adapter" },
    { number: 3, title: "Target System", description: "Configure your target adapter" },
    { number: 4, title: "Matching Rules", description: "Define how records should match" },
    { number: 5, title: "Review & Create", description: "Review and create your job" },
  ];

  // Track onboarding start
  useEffect(() => {
    const sessionId = crypto.randomUUID();
    sessionStorage.setItem("sessionId", sessionId);
    
    trackEvent({
      event: "onboarding.started",
      timestamp: Date.now(),
      metadata: {
        step: 1,
        totalSteps: steps.length,
      },
    });
  }, []);

  // Track step changes
  useEffect(() => {
    const stepDuration = Date.now() - stepStartTimeRef.current;
    
    trackEvent({
      event: "onboarding.step_viewed",
      timestamp: Date.now(),
      step,
      duration: stepDuration,
      metadata: {
        stepName: steps[step - 1]?.title,
      },
    });

    stepStartTimeRef.current = Date.now();
  }, [step]);

  async function handleSubmit() {
    try {
      setLoading(true);
      setError(null);

      const createStartTime = Date.now();
      const job = await client.jobs.create({
        name: formData.name,
        source: {
          adapter: formData.sourceAdapter,
          config: formData.sourceConfig,
        },
        target: {
          adapter: formData.targetAdapter,
          config: formData.targetConfig,
        },
        rules: {
          matching: [
            { field: "order_id", type: "exact" },
            { field: "amount", type: "exact", tolerance: 0.01 },
          ],
        },
      });

      const totalDuration = Date.now() - startTimeRef.current;
      const createDuration = Date.now() - createStartTime;

      // Track "aha moment" - first successful job creation
      if (!ahaMomentReachedRef.current) {
        ahaMomentReachedRef.current = true;
        
        trackEvent({
          event: "onboarding.aha_moment",
          timestamp: Date.now(),
          duration: totalDuration,
          metadata: {
            jobId: job.data.id,
            jobName: formData.name,
            sourceAdapter: formData.sourceAdapter,
            targetAdapter: formData.targetAdapter,
            timeToAhaMoment: totalDuration,
            targetTimeMs: 5 * 60 * 1000, // 5 minutes target
            withinTarget: totalDuration < 5 * 60 * 1000,
          },
        });
      }

      // Track job creation success
      trackEvent({
        event: "onboarding.job_created",
        timestamp: Date.now(),
        duration: createDuration,
        metadata: {
          jobId: job.data.id,
          totalOnboardingDuration: totalDuration,
        },
      });

      // Track onboarding completion
      trackEvent({
        event: "onboarding.completed",
        timestamp: Date.now(),
        duration: totalDuration,
        metadata: {
          totalSteps: steps.length,
          finalStep: step,
        },
      });

      onComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create job";
      setError(message);
      
      // Track error
      trackEvent({
        event: "onboarding.error",
        timestamp: Date.now(),
        step,
        metadata: {
          error: message,
          stepName: steps[step - 1]?.title,
        },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="px-8 pt-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s) => (
              <div key={s.number} className="flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      step >= s.number
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {s.number}
                  </div>
                  {s.number < steps.length && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > s.number ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
                <div className="mt-2 text-xs text-center">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-gray-500">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-6">
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Job Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Shopify-Stripe Daily Reconciliation"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Source System</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adapter
                  </label>
                  <select
                    value={formData.sourceAdapter}
                    onChange={(e) =>
                      setFormData({ ...formData, sourceAdapter: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  >
                    <option value="shopify">Shopify</option>
                    <option value="stripe">Stripe</option>
                    <option value="quickbooks">QuickBooks</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.sourceConfig.api_key || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sourceConfig: { ...formData.sourceConfig, api_key: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                    placeholder="Enter API key"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Target System</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adapter
                  </label>
                  <select
                    value={formData.targetAdapter}
                    onChange={(e) =>
                      setFormData({ ...formData, targetAdapter: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                  >
                    <option value="stripe">Stripe</option>
                    <option value="shopify">Shopify</option>
                    <option value="quickbooks">QuickBooks</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.targetConfig.api_key || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetConfig: { ...formData.targetConfig, api_key: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded"
                    placeholder="Enter API key"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Matching Rules</h2>
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  Default matching rules will be used:
                </p>
                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                  <li>Match by order_id (exact)</li>
                  <li>Match by amount (exact, tolerance: $0.01)</li>
                </ul>
                <p className="mt-4 text-xs text-blue-600">
                  You can customize these rules after creating the job.
                </p>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Review & Create</h2>
              <div className="bg-gray-50 rounded p-4 space-y-2">
                <div>
                  <span className="font-medium">Job Name:</span> {formData.name}
                </div>
                <div>
                  <span className="font-medium">Source:</span> {formData.sourceAdapter}
                </div>
                <div>
                  <span className="font-medium">Target:</span> {formData.targetAdapter}
                </div>
              </div>
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => {
                trackEvent({
                  event: "onboarding.step_previous",
                  timestamp: Date.now(),
                  step,
                  metadata: {
                    fromStep: step,
                    toStep: step - 1,
                  },
                });
                setStep(Math.max(1, step - 1));
              }}
              disabled={step === 1}
              className="px-4 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {step < steps.length ? (
              <button
                onClick={() => {
                  trackEvent({
                    event: "onboarding.step_next",
                    timestamp: Date.now(),
                    step,
                    metadata: {
                      fromStep: step,
                      toStep: step + 1,
                    },
                  });
                  setStep(step + 1);
                }}
                disabled={step === 1 && !formData.name}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Job"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
