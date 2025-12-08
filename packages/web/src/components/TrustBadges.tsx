'use client';

import { useEffect, useRef, useState } from 'react';

export function TrustBadges() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const badges = [
    { name: 'SOC 2 Type II', icon: '🔒' },
    { name: 'GDPR Compliant', icon: '🛡️' },
    { name: 'PCI-DSS Ready', icon: '💳' },
    { name: '99.99% Uptime', icon: '⚡' },
  ];

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center justify-center gap-6 py-8"
      role="list"
      aria-label="Trust badges and certifications"
    >
      {badges.map((badge, index) => (
        <div
          key={index}
          className={`
            flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm
            transition-all duration-500
            ${isVisible
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-4 scale-95'
            }
            hover:shadow-lg hover:scale-105
          `}
          style={{
            transitionDelay: prefersReducedMotion ? '0ms' : `${index * 100}ms`,
          }}
          role="listitem"
          aria-label={badge.name}
        >
          <span className="text-2xl" aria-hidden="true">
            {badge.icon}
          </span>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {badge.name}
          </span>
        </div>
      ))}
    </div>
  );
}
