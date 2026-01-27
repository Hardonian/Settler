/**
 * Onboarding State Machine
 * 
 * Manages the multi-step onboarding flow:
 * 1. Create workspace (required)
 * 2. Add teammates (optional)
 * 3. Connect data source (optional)
 * 4. Run first reconciliation (optional)
 * 5. View results (required)
 */

import { setup, assign, fromPromise } from 'xstate';
import {
  logFlowStarted,
  logStepViewed,
  logStepCompleted,
  logFlowCompleted,
  logFlowAbandoned,
  logError,
  logRetry,
} from '@/lib/ux-events/logger';

/**
 * Onboarding step definition
 */
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  actionUrl: string;
  optional: boolean;
  status: 'completed' | 'current' | 'pending' | 'skipped';
}

/**
 * Context for onboarding machine
 */
export interface OnboardingContext {
  workspaceId: string | null;
  workspaceName: string;
  workspaceSlug: string;
  inviteEmail: string;
  inviteRole: 'admin' | 'member' | 'viewer';
  steps: OnboardingStep[];
  progress: number;
  currentStepId: string;
  error: Error | null;
}

/**
 * Events for onboarding machine
 */
export type OnboardingEvents =
  | { type: 'LOAD_PROGRESS'; workspaceId: string }
  | { type: 'UPDATE_WORKSPACE_NAME'; name: string }
  | { type: 'UPDATE_WORKSPACE_SLUG'; slug: string }
  | { type: 'CREATE_WORKSPACE' }
  | { type: 'UPDATE_INVITE_EMAIL'; email: string }
  | { type: 'UPDATE_INVITE_ROLE'; role: 'admin' | 'member' | 'viewer' }
  | { type: 'SEND_INVITE' }
  | { type: 'SKIP_TEAMMATES' }
  | { type: 'SKIP_DATA_SOURCE' }
  | { type: 'SKIP_RECONCILIATION' }
  | { type: 'COMPLETE_STEP'; stepId: string }
  | { type: 'GO_TO_STEP'; stepId: string }
  | { type: 'RETRY' }
  | { type: 'RESET' };

/**
 * Load onboarding progress with timeout
 */
async function loadProgress(workspaceId: string): Promise<{
  progress: { progress: number; currentStep: string };
  steps: OnboardingStep[];
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`/api/workspaces/${workspaceId}/onboarding`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to load onboarding progress: ${response.statusText}`);
    }
    return response.json();
  } catch {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  }
}

/**
 * Create workspace with timeout
 */
async function createWorkspace(data: {
  name: string;
  slug: string;
}): Promise<{ workspace: { id: string } }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Failed to create workspace: ${response.statusText}`);
    }
    return response.json();
  } catch {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  }
}

/**
 * Complete onboarding step with timeout
 */
async function completeStep(
  workspaceId: string,
  stepId: string
): Promise<{
  progress: { progress: number; currentStep: string };
  steps: OnboardingStep[];
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(
      `/api/workspaces/${workspaceId}/onboarding/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Failed to complete step: ${response.statusText}`);
    }
    return response.json();
  } catch {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  }
}

/**
 * Send team invite with timeout
 */
async function sendInvite(
  workspaceId: string,
  data: { email: string; role: 'admin' | 'member' | 'viewer' }
): Promise<void> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`/api/workspaces/${workspaceId}/invites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Failed to send invite: ${response.statusText}`);
    }
  } catch {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw error;
  }
}

/**
 * Validate workspace form
 */
function isValidWorkspaceForm(context: OnboardingContext): boolean {
  return (
    context.workspaceName.trim().length >= 2 &&
    context.workspaceSlug.trim().length >= 2 &&
    /^[a-z0-9-]+$/.test(context.workspaceSlug)
  );
}

/**
 * Validate invite form
 */
function isValidInviteForm(context: OnboardingContext): boolean {
  return (
    context.inviteEmail.includes('@') &&
    context.inviteEmail.trim().length > 0
  );
}

/**
 * Onboarding state machine
 */
export const onboardingMachine = setup({
  types: {
    context: {} as OnboardingContext,
    events: {} as OnboardingEvents,
  },
  guards: {
    isValidWorkspaceForm: ({ context }: { context: OnboardingContext }) => {
      return isValidWorkspaceForm(context);
    },
    isValidInviteForm: ({ context }: { context: OnboardingContext }) => {
      return isValidInviteForm(context);
    },
    hasWorkspaceId: ({ context }: { context: OnboardingContext }) => !!context.workspaceId,
    isComplete: ({ context }: { context: OnboardingContext }) => context.progress >= 100,
  },
  actors: {
    loadProgress: fromPromise(({ input }: { input: string }) => {
      return loadProgress(input);
    }),
    createWorkspace: fromPromise(({ input }: { input: { name: string; slug: string } }) => {
      return createWorkspace(input);
    }),
    completeStep: fromPromise(({
      input,
    }: {
      input: { workspaceId: string; stepId: string };
    }) => {
      return completeStep(input.workspaceId, input.stepId);
    }),
    sendInvite: fromPromise(({
      input,
    }: {
      input: {
        workspaceId: string;
        email: string;
        role: 'admin' | 'member' | 'viewer';
      };
    }) => {
      return sendInvite(input.workspaceId, {
        email: input.email,
        role: input.role,
      });
    }),
  },
}).createMachine({
  id: 'onboarding',
  initial: 'initializing',
  context: {
    workspaceId: null,
    workspaceName: '',
    workspaceSlug: '',
    inviteEmail: '',
    inviteRole: 'member',
    steps: [],
    progress: 0,
    currentStepId: 'create_workspace',
    error: null,
  },
  states: {
    initializing: {
      always: [
        {
          guard: 'hasWorkspaceId',
          target: 'loadingProgress',
        },
        {
          target: 'createWorkspace',
        },
      ],
    },
    loadingProgress: {
      entry: [
        assign({ error: null }),
        () => logFlowStarted('onboarding', 'Onboarding'),
      ],
      invoke: {
        src: 'loadProgress',
        input: ({ context }) => context.workspaceId!,
        onDone: {
          target: 'idle',
          actions: [
            assign({
              steps: ({ event }) => event.output.steps,
              progress: ({ event }) => event.output.progress.progress,
              currentStepId: ({ event }) => event.output.progress.currentStep,
            }),
            ({ context }) => {
              const currentStep = context.steps.find(
                (s) => s.id === context.currentStepId
              );
              if (currentStep) {
                logStepViewed('onboarding', currentStep.id, currentStep.title);
              }
            },
          ],
        },
        onError: {
          target: 'error',
          actions: [
            assign({
              error: ({ event }) => event.error as Error,
            }),
            ({ event }) => {
              logError(
                event.error instanceof Error ? event.error.message : 'Unknown error',
                'load_progress',
                'onboarding'
              );
            },
          ],
        },
      },
    },
    createWorkspace: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            UPDATE_WORKSPACE_NAME: {
              actions: assign({
                workspaceName: ({ event }) => event.name,
              }),
            },
            UPDATE_WORKSPACE_SLUG: {
              actions: assign({
                workspaceSlug: ({ event }) => event.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
              }),
            },
            CREATE_WORKSPACE: {
              guard: 'isValidWorkspaceForm',
              target: 'creating',
            },
          },
        },
        creating: {
          entry: assign({ error: null }),
          invoke: {
            src: 'createWorkspace',
            input: ({ context }) => ({
              name: context.workspaceName,
              slug: context.workspaceSlug,
            }),
            onDone: {
              target: 'completingStep',
              actions: assign({
                workspaceId: ({ event }) => {
                  const id = event.output.workspace.id;
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('current_workspace_id', id);
                  }
                  return id;
                },
                currentStepId: () => 'create_workspace',
              }),
            },
            onError: {
              target: 'error',
              actions: assign({
                error: ({ event }) => event.error as Error,
              }),
            },
          },
        },
        error: {
          on: {
            RETRY: { target: 'creating' },
            RESET: { target: 'idle', actions: assign({ error: null }) },
          },
        },
      },
    },
    completingStep: {
      entry: assign({ error: null }),
      invoke: {
        src: 'completeStep',
        input: ({ context }) => ({
          workspaceId: context.workspaceId!,
          stepId: context.currentStepId,
        }),
        onDone: {
          target: 'idle',
          actions: [
            assign({
              steps: ({ event }) => event.output.steps,
              progress: ({ event }) => event.output.progress.progress,
              currentStepId: ({ event }) => event.output.progress.currentStep,
            }),
            ({ context, event }) => {
              const completedStep = context.steps.find(
                (s) => s.id === context.currentStepId
              );
              if (completedStep) {
                logStepCompleted('onboarding', completedStep.id, completedStep.title);
              }
              
              // Log flow completion if 100%
              if (event.output.progress.progress >= 100) {
                logFlowCompleted('onboarding', 'Onboarding', 0, context.steps.length);
              }
            },
          ],
        },
        onError: {
          target: 'error',
          actions: [
            assign({
              error: ({ event }) => event.error as Error,
            }),
            ({ context, event }) => {
              logError(
                event.error instanceof Error ? event.error.message : 'Unknown error',
                'complete_step',
                'onboarding',
                context.currentStepId
              );
            },
          ],
        },
      },
      always: {
        guard: 'isComplete',
        target: 'complete',
      },
    },
    idle: {
      on: {
        UPDATE_WORKSPACE_NAME: {
          actions: assign({
            workspaceName: ({ event }) => event.name,
          }),
        },
        UPDATE_WORKSPACE_SLUG: {
          actions: assign({
            workspaceSlug: ({ event }) => event.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
          }),
        },
        UPDATE_INVITE_EMAIL: {
          actions: assign({
            inviteEmail: ({ event }) => event.email,
          }),
        },
        UPDATE_INVITE_ROLE: {
          actions: assign({
            inviteRole: ({ event }) => event.role,
          }),
        },
        SEND_INVITE: {
          guard: 'isValidInviteForm',
          target: 'sendingInvite',
        },
        SKIP_TEAMMATES: {
          target: 'completingStep',
          actions: assign({
            currentStepId: () => 'skip_teammates',
          }),
        },
        SKIP_DATA_SOURCE: {
          target: 'completingStep',
          actions: assign({
            currentStepId: () => 'skip_data_source',
          }),
        },
        SKIP_RECONCILIATION: {
          target: 'completingStep',
          actions: assign({
            currentStepId: () => 'skip_reconciliation',
          }),
        },
        COMPLETE_STEP: {
          target: 'completingStep',
          actions: assign({
            currentStepId: ({ event }) => event.stepId,
          }),
        },
        GO_TO_STEP: {
          actions: assign({
            currentStepId: ({ event }) => event.stepId,
          }),
        },
        LOAD_PROGRESS: {
          target: 'loadingProgress',
          actions: assign({
            workspaceId: ({ event }) => event.workspaceId,
          }),
        },
      },
      always: {
        guard: 'isComplete',
        target: 'complete',
      },
    },
    sendingInvite: {
      entry: assign({ error: null }),
      invoke: {
        src: 'sendInvite',
        input: ({ context }) => ({
          workspaceId: context.workspaceId!,
          email: context.inviteEmail,
          role: context.inviteRole,
        }),
        onDone: {
          target: 'idle',
          actions: assign({
            inviteEmail: () => '',
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error as Error,
          }),
        },
      },
    },
    error: {
      entry: [
        assign({
          error: ({ event }) => {
            // Preserve existing error or use event error
            if ('error' in event && event.error) {
              return event.error as Error;
            }
            return new Error('An unexpected error occurred');
          },
        }),
        ({ context }) => {
          logError(
            context.error?.message || 'Unknown error',
            'state_machine_error',
            'onboarding',
            context.currentStepId
          );
        },
      ],
      on: {
        RETRY: [
          {
            guard: ({ context }) => context.workspaceId !== null,
            target: 'loadingProgress',
            actions: ({ context }) => {
              logRetry('onboarding', context.currentStepId, 1);
            },
          },
          {
            target: 'createWorkspace.idle',
            actions: ({ context }) => {
              logRetry('onboarding', context.currentStepId, 1);
            },
          },
        ],
        RESET: {
          target: 'createWorkspace',
          actions: [
            assign({
              workspaceId: null,
              workspaceName: '',
              workspaceSlug: '',
              inviteEmail: '',
              inviteRole: 'member',
              steps: [],
              progress: 0,
              currentStepId: 'create_workspace',
              error: null,
            }),
            () => {
              logFlowAbandoned('onboarding', 'Onboarding', 'create_workspace', 0);
            },
          ],
        },
      },
    },
    complete: {
      type: 'final',
    },
  },
});
