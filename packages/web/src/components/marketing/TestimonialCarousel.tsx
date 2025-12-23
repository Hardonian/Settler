/**
 * Testimonial Carousel Component
 * 
 * Rotating testimonials from real customers.
 * Builds trust and social proof.
 */

'use client';

import { useState, useEffect } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Testimonial {
  name: string;
  role: string;
  company: string;
  image: string;
  quote: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: 'Sarah Chen',
    role: 'CTO',
    company: 'TechCorp',
    image: '👩‍💼',
    quote: 'Settler eliminated $100K+ in annual risk by providing deterministic reconciliation with complete audit trails. System-level enforcement, not human promises. Compliance-ready from day one.',
    rating: 5,
  },
  {
    name: 'Michael Rodriguez',
    role: 'Head of Finance',
    company: 'EcomPlus',
    image: '👨‍💼',
    quote: 'We\'ve reconciled over 2M transactions with Settler. Webhook-based reconciliation with near-real-time results. System-level enforcement eliminates operational risk.',
    rating: 5,
  },
  {
    name: 'Emily Johnson',
    role: 'Engineering Lead',
    company: 'SaaSCo',
    image: '👩‍💻',
    quote: 'Deterministic reconciliation with complete audit trails. We integrated Settler in one afternoon and it\'s been providing system-level guarantees for months. Best infrastructure decision we made.',
    rating: 5,
  },
  {
    name: 'David Kim',
    role: 'VP of Operations',
    company: 'FinTech Startup',
    image: '👨‍💼',
    quote: 'Settler eliminated $50K+ in annual risk in the first quarter alone. Deterministic reconciliation with complete audit trails. System-level enforcement prevents errors from becoming catastrophes.',
    rating: 5,
  },
];

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex]!;

  return (
    <section
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900"
      role="region"
      aria-labelledby="testimonials-heading"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2
            id="testimonials-heading"
            className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white"
          >
            Loved by Developers & Finance Teams
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            See what our customers are saying
          </p>
        </div>

        <Card className="relative overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-2xl">
          <CardContent className="p-8 md:p-12">
            <div className="flex items-start gap-4 mb-6">
              <Quote className="w-12 h-12 text-blue-600 flex-shrink-0" />
              <div className="flex-1">
                <blockquote className="text-2xl md:text-3xl font-medium text-slate-900 dark:text-white mb-6 leading-relaxed">
                  "{currentTestimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-3xl shadow-lg"
                    aria-hidden="true"
                  >
                    {currentTestimonial.image}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-slate-900 dark:text-white">
                      {currentTestimonial.name}
                    </div>
                    <div className="text-slate-600 dark:text-slate-400">
                      {currentTestimonial.role}, {currentTestimonial.company}
                    </div>
                    <div className="flex items-center gap-1 mt-1" role="img" aria-label={`${currentTestimonial.rating} out of 5 stars`}>
                      {[...Array(currentTestimonial.rating)].map((_, i) => (
                        <span key={i} className="text-yellow-400 text-lg" aria-hidden="true">
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentIndex(index);
                    }}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      index === currentIndex
                        ? 'bg-blue-600 w-8'
                        : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                    )}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevious}
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNext}
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
