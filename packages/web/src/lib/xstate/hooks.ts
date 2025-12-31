/**
 * XState Hooks
 * 
 * Ergonomic hooks for consuming state machines in React
 */

import { useMachine, useSelector } from '@xstate/react';
import { ActorRefFrom, AnyStateMachine } from 'xstate';
import { isPendingState, isSuccessState, isErrorState, isIdleState } from './types';

/**
 * Hook to use a state machine with common selectors
 */
export function useMachineState<TMachine extends AnyStateMachine>(
  machine: TMachine,
  options?: Parameters<typeof useMachine>[1]
) {
  const [state, send, actor] = useMachine(machine, options);

  const isPending = useSelector(actor, (s: any) => isPendingState(s.value as string));
  const isSuccess = useSelector(actor, (s: any) => isSuccessState(s.value as string));
  const isError = useSelector(actor, (s: any) => isErrorState(s.value as string));
  const isIdle = useSelector(actor, (s: any) => isIdleState(s.value as string));

  return {
    state,
    send,
    actor,
    isPending,
    isSuccess,
    isError,
    isIdle,
  };
}

/**
 * Hook to select specific state value
 */
export function useStateValue<TMachine extends AnyStateMachine>(
  actor: ActorRefFrom<TMachine>
) {
  return useSelector(actor, (state) => (state as any).value);
}

/**
 * Hook to select context value
 */
export function useContextValue<TMachine extends AnyStateMachine>(
  actor: ActorRefFrom<TMachine>,
  selector?: (context: any) => unknown
) {
  if (selector) {
    return useSelector(actor, (state: any) => selector(state.context));
  }
  return useSelector(actor, (state: any) => state.context);
}

/**
 * Hook to check if machine can receive an event
 */
export function useCanReceiveEvent<TMachine extends AnyStateMachine>(
  actor: ActorRefFrom<TMachine>,
  eventType: string
) {
  return useSelector(actor, (state: any) => {
    return (state.can && typeof state.can === 'function') ? state.can({ type: eventType } as any) : false;
  });
}
