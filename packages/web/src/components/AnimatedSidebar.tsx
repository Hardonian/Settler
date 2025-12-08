'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SidebarItem {
  id: string;
  title: string;
}

interface AnimatedSidebarProps {
  items: SidebarItem[];
  activeId: string;
  onItemClick: (id: string) => void;
  title?: string;
}

/**
 * Animated sidebar navigation component
 * Accessible with keyboard navigation
 */
export function AnimatedSidebar({
  items,
  activeId,
  onItemClick,
  title = 'Contents',
}: AnimatedSidebarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sidebarRef.current) {
      observer.observe(sidebarRef.current);
    }

    return () => {
      if (sidebarRef.current) {
        observer.unobserve(sidebarRef.current);
      }
    };
  }, []);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div ref={sidebarRef} className="lg:col-span-1">
      <Card
        className={`
          bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 sticky top-24
          transition-all duration-700
          ${isVisible
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-4'
          }
        `}
        style={{
          transitionDelay: prefersReducedMotion ? '0ms' : '200ms',
        }}
        role="navigation"
        aria-label="Documentation navigation"
      >
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <nav className="space-y-2" role="list">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`
                  w-full text-left px-4 py-2 rounded-md transition-all duration-200
                  focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none
                  ${
                    activeId === item.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}
                role="listitem"
                aria-current={activeId === item.id ? 'page' : undefined}
                aria-label={`Navigate to ${item.title} section`}
              >
                {item.title}
              </button>
            ))}
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
