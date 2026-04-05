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
    {
      name: 'SOC 2 — program in progress',
      icon: '/assets/icons/soc2-badge.svg',
      description: 'Type II audit planned; not a completed attestation yet.',
    },
    {
      name: 'Privacy & data rights',
      icon: '/assets/icons/gdpr-badge.svg',
      description: 'Processor workflows and DPA — not a legal “compliant” badge.',
    },
    {
      name: 'Card data — scope minimization',
      icon: '/assets/icons/payment-secure-badge.svg',
      description: 'Design for least cardholder data; PCI posture is deployment-specific.',
    },
    {
      name: 'Public connectivity status',
      icon: '/assets/icons/uptime-badge.svg',
      description: 'Live probes only — no historical uptime % or default SLA claim.',
    },
    {
      name: 'Encryption in transit & at rest',
      icon: '/assets/icons/encryption-badge.svg',
      description: 'TLS and storage encryption depend on your deployment configuration.',
    },
    {
      name: '30-Day Guarantee',
      icon: '/assets/icons/money-back-badge.svg',
      description: 'Where offered on your plan terms.',
    },
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
