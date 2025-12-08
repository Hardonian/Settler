/**
 * Typography Utilities
 * 
 * Centralized typography classes and utilities for consistent text styling.
 */

import { cn } from '@/lib/utils';

/**
 * Typography size variants
 */
export const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
  '6xl': 'text-6xl',
} as const;

/**
 * Font weight variants
 */
export const fontWeights = {
  thin: 'font-thin',
  extralight: 'font-extralight',
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
  black: 'font-black',
} as const;

/**
 * Text alignment utilities
 */
export const textAlign = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify',
} as const;

/**
 * Line height utilities
 */
export const lineHeights = {
  none: 'leading-none',
  tight: 'leading-tight',
  snug: 'leading-snug',
  normal: 'leading-normal',
  relaxed: 'leading-relaxed',
  loose: 'leading-loose',
} as const;

/**
 * Letter spacing utilities
 */
export const letterSpacing = {
  tighter: 'tracking-tighter',
  tight: 'tracking-tight',
  normal: 'tracking-normal',
  wide: 'tracking-wide',
  wider: 'tracking-wider',
  widest: 'tracking-widest',
} as const;

/**
 * Heading component styles
 */
export const headingStyles = {
  h1: cn('text-4xl font-bold leading-tight tracking-tight'),
  h2: cn('text-3xl font-bold leading-tight tracking-tight'),
  h3: cn('text-2xl font-semibold leading-tight tracking-tight'),
  h4: cn('text-xl font-semibold leading-tight tracking-tight'),
  h5: cn('text-lg font-semibold leading-tight tracking-tight'),
  h6: cn('text-base font-semibold leading-tight tracking-tight'),
} as const;

/**
 * Paragraph styles
 */
export const paragraphStyles = {
  default: cn('text-base leading-relaxed'),
  sm: cn('text-sm leading-relaxed'),
  lg: cn('text-lg leading-relaxed'),
} as const;

/**
 * Text color utilities (semantic)
 */
export const textColors = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  accent: 'text-accent-foreground',
  destructive: 'text-destructive',
  primary: 'text-primary-600',
} as const;
