'use client';

import { useEffect, useRef, useState } from 'react';
import { SafeImage } from '@/components/SafeImage';

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

  interface TrustBadge {
    name: string;
    icon: string;
    description: string;
  }

  const badges: TrustBadge[] = [
    { name: 'SOC 2 Planned Q3 2026', icon: '/assets/icons/soc2-badge.svg', description: 'Enterprise security certification planned' },
    { name: 'GDPR Compliant', icon: '/assets/icons/gdpr-badge.svg', description: 'EU data protection compliant' },
    { name: 'PCI-DSS Ready', icon: '/assets/icons/payment-secure-badge.svg', description: 'Payment security standards' },
    { name: '99.99% Uptime', icon: '/assets/icons/uptime-badge.svg', description: 'SLA-backed availability (Enterprise)' },
    { name: 'Bank-Level Encryption', icon: '/assets/icons/encryption-badge.svg', description: 'AES-256 encryption at rest' },
    { name: '30-Day Guarantee', icon: '/assets/icons/money-back-badge.svg', description: 'Money-back guarantee' },
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
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <SafeImage
              src={badge.icon}
              alt={`${badge.name} badge`}
              width={32}
              height={32}
              className="object-contain"
              fallbackTitle={badge.name}
              fallbackCaption={badge.description}
              unoptimized
              sizes="32px"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {badge.name}
            </span>
            {badge.description && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {badge.description}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
