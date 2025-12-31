/**
 * Demo State Machine
 * 
 * Reference implementation demonstrating XState patterns and conventions.
 * This machine handles a simple form submission flow with validation.
 */

import { setup, assign, fromPromise } from 'xstate';
import { AsyncContext } from './types';

/**
 * Context for the demo form machine
 */
interface DemoFormContext extends AsyncContext<{ message: string }, Error> {
  formData: {
    name: string;
    email: string;
  };
  validationErrors: {
    name?: string;
    email?: string;
  };
}

/**
 * Events for the demo form machine
 */
type DemoFormEvents =
  | { type: 'UPDATE_NAME'; name: string }
  | { type: 'UPDATE_EMAIL'; email: string }
  | { type: 'SUBMIT' }
  | { type: 'RETRY' }
  | { type: 'RESET' };

/**
 * Validation function (simulated)
 */
function validateForm(data: DemoFormContext['formData']): {
  isValid: boolean;
  errors: DemoFormContext['validationErrors'];
} {
  const errors: DemoFormContext['validationErrors'] = {};
  
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }
  
  if (!data.email || !data.email.includes('@')) {
    errors.email = 'Email must be valid';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Submit function (simulated async)
 */
async function submitForm(data: DemoFormContext['formData']): Promise<{ message: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  // Simulate occasional failure (20% chance)
  if (Math.random() < 0.2) {
    throw new Error('Network error: Please try again');
  }
  
  return {
    message: `Hello, ${data.name}! Your form has been submitted successfully.`,
  };
}

/**
 * Demo form state machine
 */
export const demoFormMachine = setup({
  types: {
    context: {} as DemoFormContext,
    events: {} as DemoFormEvents,
  },
  guards: {
    isFormValid: ({ context }: { context: DemoFormContext }) => {
      const validation = validateForm(context.formData);
      return validation.isValid;
    },
    hasValidationErrors: ({ context }: { context: DemoFormContext }) => {
      return Object.keys(context.validationErrors).length > 0;
    },
  },
  actors: {
    submitForm: fromPromise(({ input }: { input: DemoFormContext['formData'] }) => {
      return submitForm(input);
    }),
  },
}).createMachine({
  id: 'demoForm',
  initial: 'idle',
  context: {
    formData: {
      name: '',
      email: '',
    },
    validationErrors: {},
    data: null,
    error: null,
  },
  states: {
    idle: {
      on: {
        UPDATE_NAME: {
          actions: assign({
            formData: ({ context, event }) => ({
              ...context.formData,
              name: event.name,
            }),
            validationErrors: ({ context, event }) => {
              const updated = { ...context.formData, name: event.name };
              const validation = validateForm(updated);
              return validation.errors;
            },
          }),
        },
        UPDATE_EMAIL: {
          actions: assign({
            formData: ({ context, event }) => ({
              ...context.formData,
              email: event.email,
            }),
            validationErrors: ({ context, event }) => {
              const updated = { ...context.formData, email: event.email };
              const validation = validateForm(updated);
              return validation.errors;
            },
          }),
        },
        SUBMIT: [
          {
            guard: ({ context }: { context: DemoFormContext }) => {
              const validation = validateForm(context.formData);
              return validation.isValid;
            },
            target: 'submitting',
          },
          {
            guard: ({ context }: { context: DemoFormContext }) => {
              return Object.keys(context.validationErrors).length > 0;
            },
            target: 'validationError',
          },
        ],
        RESET: {
          actions: assign({
            formData: () => ({ name: '', email: '' }),
            validationErrors: () => ({}),
            data: null,
            error: null,
          }),
        },
      },
    },
    validationError: {
      on: {
        UPDATE_NAME: {
          target: 'idle',
          actions: assign({
            formData: ({ context, event }) => ({
              ...context.formData,
              name: event.name,
            }),
            validationErrors: ({ context, event }) => {
              const updated = { ...context.formData, name: event.name };
              const validation = validateForm(updated);
              return validation.errors;
            },
          }),
        },
        UPDATE_EMAIL: {
          target: 'idle',
          actions: assign({
            formData: ({ context, event }) => ({
              ...context.formData,
              email: event.email,
            }),
            validationErrors: ({ context, event }) => {
              const updated = { ...context.formData, email: event.email };
              const validation = validateForm(updated);
              return validation.errors;
            },
          }),
        },
        SUBMIT: {
          guard: ({ context }: { context: DemoFormContext }) => {
            const validation = validateForm(context.formData);
            return validation.isValid;
          },
          target: 'submitting',
        },
      },
    },
    submitting: {
      entry: assign({ error: null }),
      invoke: {
        src: 'submitForm',
        input: ({ context }) => ({ input: context.formData }),
        onDone: {
          target: 'success',
          actions: assign({
            data: ({ event }) => event.output,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: ({ event }) => event.error as Error,
          }),
        },
      },
      on: {
        RESET: {
          target: 'idle',
        },
      },
    },
    success: {
      on: {
        RESET: {
          target: 'idle',
          actions: assign({
            formData: () => ({ name: '', email: '' }),
            validationErrors: () => ({}),
            data: null,
            error: null,
          }),
        },
      },
    },
    error: {
      on: {
        RETRY: {
          target: 'submitting',
        },
        RESET: {
          target: 'idle',
          actions: assign({
            formData: () => ({ name: '', email: '' }),
            validationErrors: () => ({}),
            data: null,
            error: null,
          }),
        },
      },
    },
  },
});
