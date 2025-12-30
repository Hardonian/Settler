/**
 * XState Conventions
 * 
 * Documentation and examples for state machine patterns
 */

/**
 * CONVENTIONS
 * 
 * 1. State Names
 *    - Use descriptive, action-oriented names: 'validating', 'submitting', 'loading'
 *    - Use kebab-case for compound states: 'validating-input', 'submitting-form'
 *    - Use standard async states: 'idle', 'pending', 'success', 'error'
 * 
 * 2. Event Names
 *    - Use UPPER_SNAKE_CASE: 'SUBMIT', 'RETRY', 'RESET'
 *    - Be specific: 'SUBMIT_FORM' not 'SUBMIT'
 *    - Use past tense for completion: 'VALIDATION_COMPLETE', 'SUBMIT_SUCCESS'
 * 
 * 3. Context
 *    - Keep context flat and serializable
 *    - Store only necessary state (not derived values)
 *    - Use null for uninitialized values
 *    - Separate data and error: { data: T | null, error: Error | null }
 * 
 * 4. Guards
 *    - Name guards descriptively: 'isFormValid', 'hasRequiredFields'
 *    - Keep guards pure (no side effects)
 *    - Return boolean explicitly
 * 
 * 5. Actions
 *    - Use assign() for context updates
 *    - Name actions descriptively: 'setFormData', 'clearError'
 *    - Keep actions synchronous when possible
 * 
 * 6. Services (Invoke)
 *    - Use for async operations
 *    - Name services descriptively: 'validateForm', 'submitData'
 *    - Handle errors explicitly with onError
 *    - Use onDone/onError for state transitions
 * 
 * 7. Transitions
 *    - Always define explicit transitions
 *    - Use guards to prevent invalid transitions
 *    - Handle all possible outcomes (success, error, timeout)
 * 
 * 8. Type Safety
 *    - Define typed context: interface MyContext { ... }
 *    - Define typed events: type MyEvents = { type: 'SUBMIT'; data: FormData }
 *    - Use TypeScript generics for reusable machines
 */

/**
 * EXAMPLE: Simple Form Machine Pattern
 * 
 * ```typescript
 * interface FormContext {
 *   data: FormData | null;
 *   error: Error | null;
 * }
 * 
 * type FormEvents =
 *   | { type: 'SUBMIT'; data: FormData }
 *   | { type: 'RETRY' }
 *   | { type: 'RESET' };
 * 
 * const formMachine = setup({
 *   types: {
 *     context: {} as FormContext,
 *     events: {} as FormEvents,
 *   },
 *   guards: {
 *     isValid: ({ context, event }) => {
 *       if (event.type !== 'SUBMIT') return false;
 *       return validateForm(event.data);
 *     },
 *   },
 *   actors: {
 *     submitForm: ({ input }: { input: FormData }) => {
 *       return fromPromise(async () => {
 *         const response = await fetch('/api/submit', {
 *           method: 'POST',
 *           body: JSON.stringify(input),
 *         });
 *         if (!response.ok) throw new Error('Submission failed');
 *         return response.json();
 *       });
 *     },
 *   },
 * }).createMachine({
 *   id: 'form',
 *   initial: 'idle',
 *   context: {
 *     data: null,
 *     error: null,
 *   },
 *   states: {
 *     idle: {
 *       on: {
 *         SUBMIT: {
 *           guard: 'isValid',
 *           target: 'submitting',
 *           actions: assign({ data: ({ event }) => event.data }),
 *         },
 *       },
 *     },
 *     submitting: {
 *       invoke: {
 *         src: 'submitForm',
 *         input: ({ context }) => ({ input: context.data! }),
 *         onDone: {
 *           target: 'success',
 *           actions: assign({ data: ({ event }) => event.output }),
 *         },
 *         onError: {
 *           target: 'error',
 *           actions: assign({ error: ({ event }) => event.error }),
 *         },
 *       },
 *     },
 *     success: {
 *       on: {
 *         RESET: { target: 'idle', actions: assign({ data: null, error: null }) },
 *       },
 *     },
 *     error: {
 *       on: {
 *         RETRY: { target: 'submitting' },
 *         RESET: { target: 'idle', actions: assign({ data: null, error: null }) },
 *       },
 *     },
 *   },
 * });
 * ```
 */

export const conventions = {
  /**
   * State naming patterns
   */
  stateNames: {
    async: ['idle', 'pending', 'success', 'error'] as const,
    validation: ['idle', 'validating', 'valid', 'invalid'] as const,
    submission: ['idle', 'submitting', 'submitted', 'error'] as const,
  },
  
  /**
   * Event naming patterns
   */
  eventNames: {
    submit: 'SUBMIT',
    retry: 'RETRY',
    reset: 'RESET',
    cancel: 'CANCEL',
    validate: 'VALIDATE',
    complete: 'COMPLETE',
  },
} as const;
