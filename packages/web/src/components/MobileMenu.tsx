'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NavLink } from './NavLink';
import { cn } from '@/lib/utils';

export interface MobileMenuProps {
  /**
   * Whether menu is open
   */
  open: boolean;
  
  /**
   * Callback when menu should close
   */
  onClose: () => void;
  
  /**
   * Navigation items
   */
  items: Array<{ href: string; label: string }>;
}

/**
 * Mobile navigation menu component
 */
export function MobileMenu({ open, onClose, items }: MobileMenuProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        'md:hidden py-4 border-t border-border',
        'animate-in slide-in-from-top-2 fade-in-0'
      )}
      role="menu"
      aria-label="Mobile navigation menu"
    >
      <div className="flex flex-col space-y-4">
        {items.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            role="menuitem"
            onClick={onClose}
          >
            {item.label}
          </NavLink>
        ))}
        <Button
          asChild
          variant="default"
          className="w-full"
          onClick={onClose}
        >
          <Link href="/playground" aria-label="Get started with Settler">
            Get Started
          </Link>
        </Button>
      </div>
    </div>
  );
}
