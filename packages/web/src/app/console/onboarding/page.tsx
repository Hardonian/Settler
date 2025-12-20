/**
 * Onboarding Wizard Page
 * 
 * Multi-step wizard for new user onboarding:
 * 1. Create workspace
 * 2. Add teammates (optional)
 * 3. Connect data source OR upload sample file
 * 4. Run first reconciliation/import
 * 5. View results dashboard
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, ArrowRight, Database, Play, Eye } from 'lucide-react';
// Note: trace_id handled server-side

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  optional: boolean;
  status: 'completed' | 'current' | 'pending' | 'skipped';
}

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('create_workspace');
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state for step 1
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceSlug, setWorkspaceSlug] = useState('');
  
  // Form state for step 2
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');

  useEffect(() => {
    // Get workspace ID from URL or localStorage
    const wsId = searchParams.get('workspaceId') || localStorage.getItem('current_workspace_id');
    if (wsId) {
      setWorkspaceId(wsId);
      loadProgress(wsId);
    } else {
      // If no workspace, start at step 1
      setCurrentStep('create_workspace');
      setLoading(false);
    }
  }, [searchParams]);

  const loadProgress = async (wsId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${wsId}/onboarding`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress.progress);
        setCurrentStep(data.progress.currentStep);
        setSteps(data.steps);
        setWorkspaceId(wsId);
      }
    } catch (error) {
      console.error('[Onboarding] Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (stepId: string) => {
    if (!workspaceId) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/onboarding/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId }),
      });

      if (response.ok) {
        const data = await response.json();
        setProgress(data.progress.progress);
        setCurrentStep(data.progress.currentStep);
        setSteps(data.steps);
        
        if (data.progress.progress >= 100) {
          alert('🎉 Onboarding Complete! You\'re all set to start using Settler.');
          setTimeout(() => {
            router.push('/console');
          }, 2000);
        }
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to complete step'}`);
      }
    } catch (error) {
      console.error('[Onboarding] Error completing step:', error);
      alert('Error: Failed to complete step');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName || !workspaceSlug) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workspaceName,
          slug: workspaceSlug,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWorkspaceId(data.workspace.id);
        localStorage.setItem('current_workspace_id', data.workspace.id);
        await loadProgress(data.workspace.id);
        await completeStep('create_workspace');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to create workspace'}`);
      }
    } catch (error) {
      console.error('[Onboarding] Error creating workspace:', error);
      alert('Error: Failed to create workspace');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendInvite = async () => {
    if (!workspaceId || !inviteEmail) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (response.ok) {
        alert(`Invite sent to ${inviteEmail}`);
        setInviteEmail('');
        // Optionally complete step or allow multiple invites
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to send invite'}`);
      }
    } catch (error) {
      console.error('[Onboarding] Error sending invite:', error);
      alert('Error: Failed to send invite');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const currentStepData = steps.find(s => s.id === currentStep) || steps[0];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Welcome to Settler
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Reconciliation starts automatically - no setup needed
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Progress
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {progress}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>{currentStepData?.title || 'Get Started'}</CardTitle>
            <CardDescription>{currentStepData?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Create Workspace */}
            {currentStep === 'create_workspace' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="My Company"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="workspace-slug">Workspace URL</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-500">settler.dev/</span>
                    <Input
                      id="workspace-slug"
                      value={workspaceSlug}
                      onChange={(e) => setWorkspaceSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      placeholder="my-company"
                      className="flex-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreateWorkspace}
                  disabled={submitting || !workspaceName || !workspaceSlug}
                  className="w-full"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Workspace <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Step 2: Add Teammates */}
            {currentStep === 'add_teammates' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Invite your team members to collaborate. You can skip this step and add them later.
                </p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    className="flex-1"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member' | 'viewer')}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <Button onClick={handleSendInvite} disabled={submitting || !inviteEmail}>
                    Send Invite
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => completeStep('skip_teammates')}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Skip for Now
                  </Button>
                  <Button
                    onClick={() => completeStep('add_teammates')}
                    disabled={submitting}
                    className="flex-1"
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Connect Data Source */}
            {currentStep === 'connect_data_source' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Connect a data source or upload a sample file to get started.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/console/playground')}
                    className="h-auto py-6 flex-col"
                  >
                    <Database className="w-8 h-8 mb-2" />
                    <span className="font-semibold">Connect Data Source</span>
                    <span className="text-xs text-slate-500 mt-1">Stripe, Shopify, etc.</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/console/playground/receipts')}
                    className="h-auto py-6 flex-col"
                  >
                    <Database className="w-8 h-8 mb-2" />
                    <span className="font-semibold">Upload Sample File</span>
                    <span className="text-xs text-slate-500 mt-1">CSV, JSON, etc.</span>
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={() => completeStep('skip_data_source')}
                  disabled={submitting}
                  className="w-full"
                >
                  Skip for Now (Demo Mode)
                </Button>
              </div>
            )}

            {/* Step 4: Run First Reconciliation */}
            {currentStep === 'run_first_reconciliation' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Run your first reconciliation to see Settler in action.
                </p>
                <Button
                  onClick={() => {
                    router.push('/console/playground/reconcile');
                    completeStep('run_first_reconciliation');
                  }}
                  className="w-full"
                  disabled={submitting}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Go to Playground
                </Button>
                <Button
                  variant="outline"
                  onClick={() => completeStep('skip_reconciliation')}
                  disabled={submitting}
                  className="w-full"
                >
                  Skip for Now
                </Button>
              </div>
            )}

            {/* Step 5: View Results */}
            {currentStep === 'view_results' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Great! You're all set. View your results in the dashboard.
                </p>
                <Button
                  onClick={() => {
                    completeStep('view_results');
                    router.push('/console');
                  }}
                  className="w-full"
                  disabled={submitting}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            )}

            {/* Steps List */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-sm font-semibold mb-4">Onboarding Steps</h3>
              <div className="space-y-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      step.status === 'current'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : step.status === 'current' ? (
                      <Circle className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-current" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{step.title}</div>
                      {step.optional && (
                        <span className="text-xs text-slate-500">Optional</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
