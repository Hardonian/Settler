/**
 * Button Tracker HOC
 * 
 * Higher-order component to automatically track button clicks.
 */

'use client';

import { Button as BaseButton, ButtonProps } from '@/components/ui/button';
import { useTrackButton } from './hooks';
import { useCallback } from 'react';

/**
 * Enhanced Button with automatic click tracking
 */
export function TrackedButton({ onClick, children, ...props }: ButtonProps) {
  const trackButton = useTrackButton();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Track button click
      const buttonName = 
        typeof children === 'string' 
          ? children 
          : props['aria-label'] || props.name || 'button';
      
      trackButton(buttonName, {
        variant: props.variant,
        size: props.size,
        disabled: props.disabled,
      });

      // Call original onClick
      onClick?.(e);
    },
    [onClick, children, props.variant, props.size, props.disabled, props.name, props['aria-label'], trackButton]
  );

  return <BaseButton {...props} onClick={handleClick}>{children}</BaseButton>;
}
