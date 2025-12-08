'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FAQItem {
  question: string;
  answer: string;
}

interface AnimatedFAQProps {
  faqs: FAQItem[];
  title?: string;
}

/**
 * Animated FAQ component with accordion behavior
 * Accessible with keyboard navigation
 */
export function AnimatedFAQ({ faqs, title = 'Frequently Asked Questions' }: AnimatedFAQProps) {
  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-slate-800/50"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-4xl mx-auto">
        <h2
          id="faq-heading"
          className="text-3xl md:text-4xl font-bold mb-12 text-center text-slate-900 dark:text-white"
        >
          {title}
        </h2>
        <div className="space-y-6" role="list">
          {faqs.map((faq, index) => (
            <AnimatedFAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function AnimatedFAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (itemRef.current) {
      observer.observe(itemRef.current);
    }

    return () => {
      if (itemRef.current) {
        observer.unobserve(itemRef.current);
      }
    };
  }, []);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animationDelay = prefersReducedMotion ? 0 : index * 100;

  return (
    <Card
      ref={itemRef}
      className={`
        bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800
        transition-all duration-500
        ${isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
        }
        hover:shadow-lg
        focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
      `}
      style={{
        transitionDelay: `${animationDelay}ms`,
      }}
      role="listitem"
    >
      <CardHeader>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full text-left flex items-center justify-between"
          aria-expanded={isOpen}
          aria-controls={`faq-answer-${index}`}
          id={`faq-question-${index}`}
        >
          <CardTitle className="text-lg text-slate-900 dark:text-white">
            {question}
          </CardTitle>
          <svg
            className={`w-5 h-5 text-slate-600 dark:text-slate-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </CardHeader>
      {isOpen && (
        <CardContent
          id={`faq-answer-${index}`}
          role="region"
          aria-labelledby={`faq-question-${index}`}
          className="pt-0"
        >
          <p className="text-slate-600 dark:text-slate-300">{answer}</p>
        </CardContent>
      )}
    </Card>
  );
}
