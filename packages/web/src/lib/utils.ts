import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Deterministically formats a number to a string using a fixed locale (en-US)
 * to prevent hydration mismatches between server and client.
 */
export function formatNumber(value: number | bigint): string {
  return value.toLocaleString('en-US');
}

/**
 * Deterministically formats a date to a string using a fixed locale (en-US)
 * to prevent hydration mismatches between server and client.
 */
export function formatDate(date: Date | string | number): string {
  return new Date(date).toLocaleString('en-US');
}

/**
 * Deterministically formats a currency value using a fixed locale (en-US)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
