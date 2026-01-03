/**
 * Mobile Menu Component
 * 
 * Responsive mobile navigation for admin dashboard.
 */

'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileMenu({ children, className }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        {isOpen ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Menu className="w-5 h-5" aria-hidden="true" />
        )}
      </Button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <nav
            id="mobile-menu"
            className={cn(
              'fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 z-50 transform transition-transform duration-200 lg:hidden',
              isOpen ? 'translate-x-0' : '-translate-x-full',
              className
            )}
            aria-label="Mobile navigation"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">S</div>
                  Settler Admin
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="overflow-y-auto h-[calc(100%-80px)] p-4">
              {children}
            </div>
          </nav>
        </>
      )}
    </>
  );
}
