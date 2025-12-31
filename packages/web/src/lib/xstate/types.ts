/**
 * XState Type Definitions
 * 
 * Common types and utilities for state machines
 */

import { StateValue } from 'xstate';

/**
 * Standard async state values
 * Use these for consistent async operation states
 */
export type AsyncState = 'idle' | 'pending' | 'success' | 'error';

/**
 * Standard context shape for async operations
 */
export interface AsyncContext<TData = unknown, TError = Error> {
  data: TData | null;
  error: TError | null;
}

/**
 * Standard events for async operations
 */
export interface AsyncEvents<TInput = unknown> {
  SUBMIT: { input: TInput };
  RETRY: { input?: TInput };
  RESET: Record<string, never>;
}

/**
 * Guard result type
 */
export type GuardResult = boolean;

/**
 * Action payload type
 */
export type ActionPayload = Record<string, unknown>;

/**
 * Machine metadata
 */
export interface MachineMetadata {
  name: string;
  version: string;
  description?: string;
}

/**
 * Helper to check if state is async
 */
export function isAsyncState(state: StateValue): state is AsyncState {
  return typeof state === 'string' && ['idle', 'pending', 'success', 'error'].includes(state);
}

/**
 * Helper to check if state is pending
 */
export function isPendingState(state: StateValue): boolean {
  return state === 'pending';
}

/**
 * Helper to check if state is success
 */
export function isSuccessState(state: StateValue): boolean {
  return state === 'success';
}

/**
 * Helper to check if state is error
 */
export function isErrorState(state: StateValue): boolean {
  return state === 'error';
}

/**
 * Helper to check if state is idle
 */
export function isIdleState(state: StateValue): boolean {
  return state === 'idle';
}
