/**
 * Onboarding Wizard Page
 *
 * Multi-step wizard for new user onboarding using XState.
 * 1. Create workspace
 * 2. Add teammates (optional)
 * 3. Connect data source OR upload sample file
 * 4. Run first reconciliation/import
 * 5. View results dashboard
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedButton } from "@/components/motion/AnimatedButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ProgressIndicator,
  SuccessToast,
  ErrorFeedback,
  AchievementBadge,
} from "@/components/feedback";
import { CheckCircle2, Circle, Loader2, ArrowRight, Database, Play, Eye } from "lucide-react";
import { useMachineState } from "@/lib/xstate/hooks";
import { onboardingMachine } from "@/lib/xstate/onboarding-machine";
import { stepTransition } from "@/lib/motion/variants";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, send, isPending, isError } = useMachineState(onboardingMachine);
  const context = state.context;
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);

  // Initialize: Load progress if workspace ID exists
  useEffect(() => {
    const wsId =
      searchParams.get("workspaceId") ||
      (typeof window !== "undefined" ? localStorage.getItem("current_workspace_id") : null);

    if (wsId && state.value === "initializing") {
      send({ type: "LOAD_PROGRESS", workspaceId: wsId });
    }
  }, [searchParams, send, state.value]);

  // Handle step completion success
  useEffect(() => {
    if (state.value === "idle" && context.progress > 0) {
      setShowSuccessToast(true);
    }
  }, [state.value, context.progress]);

  // Handle achievement unlock (50% milestone)
  useEffect(() => {
    if (context.progress >= 50 && context.progress < 100) {
      setShowAchievement(true);
    }
  }, [context.progress]);

  // Handle completion
  useEffect(() => {
    if (state.value === "complete") {
      setShowAchievement(true);
      // Small delay for celebration animation
      setTimeout(() => {
        router.push("/console");
      }, 3000);
    }
  }, [state.value, router]);

  // Determine current step
  const currentStepId = context.currentStepId;
  const currentStepData = context.steps.find((s) => s.id === currentStepId);

  // Check if we're in create workspace state
  const isCreatingWorkspace =
    typeof state.value === "object" &&
    "createWorkspace" in state.value &&
    (state.context.workspaceId === null || state.context.currentStepId === "create_workspace");

  // Loading state
  if (
    state.value === "initializing" ||
    state.value === "loadingProgress" ||
    (isCreatingWorkspace && state.context.workspaceId === null)
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to Settler
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Reconciliation starts automatically - no setup needed
          </p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="mb-8">
            <CardContent className="pt-6">
              <ProgressIndicator
                progress={context.progress}
                steps={context.steps.map((step) => ({
                  id: step.id,
                  label: step.title,
                  completed: step.status === "completed",
                  current: step.status === "current",
                }))}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Error Feedback */}
        {isError && context.error && (
          <div className="mb-6">
            <ErrorFeedback
              error={context.error}
              onRetry={() => send({ type: "RETRY" })}
              guidance="Please check your connection and try again."
            />
          </div>
        )}

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{currentStepData?.title || "Get Started"}</CardTitle>
            <CardDescription>{currentStepData?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Create Workspace */}
              {(currentStepId === "create_workspace" || isCreatingWorkspace) && (
                <motion.div
                  key="create_workspace"
                  variants={stepTransition}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="workspace-name">Workspace Name</Label>
                    <Input
                      id="workspace-name"
                      value={context.workspaceName}
                      onChange={(e) =>
                        send({ type: "UPDATE_WORKSPACE_NAME", name: e.target.value })
                      }
                      placeholder="My Company"
                      className="mt-1"
                      disabled={isPending}
                    />
                  </div>
                  <div>
                    <Label htmlFor="workspace-slug">Workspace URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-slate-500">settler.dev/</span>
                      <Input
                        id="workspace-slug"
                        value={context.workspaceSlug}
                        onChange={(e) =>
                          send({ type: "UPDATE_WORKSPACE_SLUG", slug: e.target.value })
                        }
                        placeholder="my-company"
                        className="flex-1"
                        disabled={isPending}
                      />
                    </div>
                  </div>
                  <AnimatedButton
                    onClick={() => send({ type: "CREATE_WORKSPACE" })}
                    disabled={
                      isPending ||
                      !context.workspaceName ||
                      !context.workspaceSlug ||
                      !/^[a-z0-9-]+$/.test(context.workspaceSlug)
                    }
                    className="w-full"
                    loading={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create Workspace <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </AnimatedButton>
                </motion.div>
              )}

              {/* Step 2: Add Teammates */}
              {currentStepId === "add_teammates" && (
                <motion.div
                  key="add_teammates"
                  variants={stepTransition}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Invite your team members to collaborate. You can skip this step and add them
                    later.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={context.inviteEmail}
                      onChange={(e) => send({ type: "UPDATE_INVITE_EMAIL", email: e.target.value })}
                      placeholder="teammate@example.com"
                      className="flex-1"
                      disabled={isPending}
                    />
                    <select
                      value={context.inviteRole}
                      onChange={(e) =>
                        send({
                          type: "UPDATE_INVITE_ROLE",
                          role: e.target.value as "admin" | "member" | "viewer",
                        })
                      }
                      className="px-3 py-2 border rounded-md"
                      disabled={isPending}
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <AnimatedButton
                      onClick={() => send({ type: "SEND_INVITE" })}
                      disabled={isPending || !context.inviteEmail}
                      loading={isPending && state.value === "sendingInvite"}
                    >
                      Send Invite
                    </AnimatedButton>
                  </div>
                  <div className="flex gap-2">
                    <AnimatedButton
                      variant="outline"
                      onClick={() => send({ type: "SKIP_TEAMMATES" })}
                      disabled={isPending}
                      className="flex-1"
                    >
                      Skip for Now
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => send({ type: "COMPLETE_STEP", stepId: "add_teammates" })}
                      disabled={isPending}
                      className="flex-1"
                    >
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </AnimatedButton>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Connect Data Source */}
              {currentStepId === "connect_data_source" && (
                <motion.div
                  key="connect_data_source"
                  variants={stepTransition}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Connect a data source or upload a sample file to get started.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <AnimatedButton
                      variant="outline"
                      onClick={() => router.push("/console/playground")}
                      className="h-auto py-6 flex-col"
                      disabled={isPending}
                    >
                      <Database className="w-8 h-8 mb-2" />
                      <span className="font-semibold">Connect Data Source</span>
                      <span className="text-xs text-slate-500 mt-1">Stripe, Shopify, etc.</span>
                    </AnimatedButton>
                    <AnimatedButton
                      variant="outline"
                      onClick={() => router.push("/console/playground/receipts")}
                      className="h-auto py-6 flex-col"
                      disabled={isPending}
                    >
                      <Database className="w-8 h-8 mb-2" />
                      <span className="font-semibold">Upload Sample File</span>
                      <span className="text-xs text-slate-500 mt-1">CSV, JSON, etc.</span>
                    </AnimatedButton>
                  </div>
                  <AnimatedButton
                    variant="outline"
                    onClick={() => send({ type: "SKIP_DATA_SOURCE" })}
                    disabled={isPending}
                    className="w-full"
                  >
                    Skip for Now (Demo Mode)
                  </AnimatedButton>
                </motion.div>
              )}

              {/* Step 4: Run First Reconciliation */}
              {currentStepId === "run_first_reconciliation" && (
                <motion.div
                  key="run_first_reconciliation"
                  variants={stepTransition}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Open the reconciliation workspace to inspect how completed runs appear in the
                    console. Triggering a real run happens through your connected jobs or API
                    workflow.
                  </p>
                  <AnimatedButton
                    onClick={() => {
                      router.push("/console/reconciliations");
                      send({ type: "COMPLETE_STEP", stepId: "run_first_reconciliation" });
                    }}
                    className="w-full"
                    disabled={isPending}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Open Reconciliations
                  </AnimatedButton>
                  <AnimatedButton
                    variant="outline"
                    onClick={() => send({ type: "SKIP_RECONCILIATION" })}
                    disabled={isPending}
                    className="w-full"
                  >
                    Skip for Now
                  </AnimatedButton>
                </motion.div>
              )}

              {/* Step 5: View Results */}
              {currentStepId === "view_results" && (
                <motion.div
                  key="view_results"
                  variants={stepTransition}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-4"
                >
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Great! You're all set. View your results in the dashboard.
                  </p>
                  <AnimatedButton
                    onClick={() => {
                      send({ type: "COMPLETE_STEP", stepId: "view_results" });
                    }}
                    className="w-full"
                    disabled={isPending}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Go to Console
                  </AnimatedButton>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Steps List */}
            {context.steps.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-sm font-semibold mb-4">Onboarding Steps</h3>
                <div className="space-y-2">
                  {context.steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        step.status === "current"
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : "bg-slate-50 dark:bg-slate-800/50"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : step.status === "current" ? (
                        <Circle className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-current" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{step.title}</div>
                        {step.optional && <span className="text-xs text-slate-500">Optional</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Toast */}
      <SuccessToast
        open={showSuccessToast}
        message="Step completed successfully!"
        onDismiss={() => setShowSuccessToast(false)}
      />

      {/* Achievement Badge */}
      {context.progress >= 50 && (
        <AchievementBadge
          open={showAchievement}
          title={context.progress >= 100 ? "Onboarding Complete!" : "Halfway There!"}
          description={
            context.progress >= 100
              ? "You're all set to start using Settler."
              : "Great progress! Keep going."
          }
          onDismiss={() => setShowAchievement(false)}
        />
      )}
    </div>
  );
}
