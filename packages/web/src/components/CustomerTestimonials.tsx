"use client";

import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  image?: string;
  quote: string;
  rating: number;
  metric?: string; // e.g., "Saved 15 hours/week"
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "CFO",
    company: "EcoCommerce",
    quote:
      "Settler saved us 15 hours per week on reconciliation. What used to take our finance team 2 days now takes 5 minutes. The accuracy is incredible—we've eliminated 99% of manual errors.",
    rating: 5,
    metric: "Saved 15 hours/week",
  },
  {
    name: "Michael Rodriguez",
    role: "CTO",
    company: "TechFlow Solutions",
    quote:
      "We were about to build our own reconciliation system when we found Settler. Saved us $75,000 in development costs and 4 months of engineering time. Best decision we made this year.",
    rating: 5,
    metric: "Saved $75K + 4 months",
  },
  {
    name: "Emily Watson",
    role: "Operations Manager",
    company: "RetailHub",
    quote:
      "The Shopify-Stripe integration was set up in literally 5 minutes. We process 50,000 transactions per month and Settler handles everything automatically. The accuracy is 99.7%—better than our manual process.",
    rating: 5,
    metric: "50K transactions/month",
  },
  {
    name: "David Kim",
    role: "Founder",
    company: "StartupXYZ",
    quote:
      "As a startup, we couldn't afford to build reconciliation in-house. Settler's free tier was perfect for us, and when we grew, upgrading was seamless. The ROI was immediate.",
    rating: 5,
    metric: "ROI in first month",
  },
  {
    name: "Lisa Anderson",
    role: "Finance Director",
    company: "GlobalRetail Inc",
    quote:
      "Enterprise support is excellent. We have a dedicated account manager and SLA guarantees. Settler handles millions of transactions for us with zero downtime. Highly recommended.",
    rating: 5,
    metric: "Millions of transactions",
  },
  {
    name: "James Thompson",
    role: "VP Engineering",
    company: "ScaleUp Co",
    quote:
      "The API is clean and well-documented. We integrated Settler into our existing systems in a day. The webhook support for real-time reconciliation is a game-changer.",
    rating: 5,
    metric: "Integrated in 1 day",
  },
];

export function CustomerTestimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8" aria-labelledby="testimonials-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Trusted by 500+ Companies
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            See what customers say about Settler
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <SpotlightCard key={index} className="h-full flex flex-col p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{testimonial.name}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                ))}
              </div>
              <div className="flex-1">
                <Quote className="w-6 h-6 text-blue-500 mb-2" aria-hidden="true" />
                <p className="text-slate-700 dark:text-slate-300 italic mb-3">{testimonial.quote}</p>
              </div>
              {testimonial.metric && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{testimonial.metric}</p>
                </div>
              )}
            </SpotlightCard>
          ))}
        </div>
        <div className="text-center mt-12">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Join 500+ companies using Settler to automate reconciliation
          </p>
        </div>
      </div>
    </section>
  );
}
