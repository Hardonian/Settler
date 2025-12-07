"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface Integration {
  name: string;
  logo: string;
  category: "payment" | "ecommerce" | "accounting" | "other";
  status: "available" | "coming-soon";
}

export function IntegrationLogos() {
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

  const integrations: Integration[] = [
    // Payment Processors
    {
      name: "Stripe",
      logo: "/assets/icons/integrations/stripe-logo.svg",
      category: "payment",
      status: "available",
    },
    {
      name: "PayPal",
      logo: "/assets/icons/integrations/paypal-logo.svg",
      category: "payment",
      status: "available",
    },
    {
      name: "Square",
      logo: "/assets/icons/integrations/square-logo.svg",
      category: "payment",
      status: "available",
    },
    {
      name: "Adyen",
      logo: "/assets/icons/integrations/adyen-logo.svg",
      category: "payment",
      status: "available",
    },
    // E-commerce Platforms
    {
      name: "Shopify",
      logo: "/assets/icons/integrations/shopify-logo.svg",
      category: "ecommerce",
      status: "available",
    },
    {
      name: "WooCommerce",
      logo: "/assets/icons/integrations/woocommerce-logo.svg",
      category: "ecommerce",
      status: "available",
    },
    {
      name: "BigCommerce",
      logo: "/assets/icons/integrations/bigcommerce-logo.svg",
      category: "ecommerce",
      status: "available",
    },
    // Accounting Systems
    {
      name: "QuickBooks",
      logo: "/assets/icons/integrations/quickbooks-logo.svg",
      category: "accounting",
      status: "available",
    },
    {
      name: "Xero",
      logo: "/assets/icons/integrations/xero-logo.svg",
      category: "accounting",
      status: "available",
    },
  ];

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const categories = {
    payment: "Payment Processors",
    ecommerce: "E-commerce Platforms",
    accounting: "Accounting Systems",
  };

  const groupedIntegrations = integrations.reduce(
    (acc, integration) => {
      if (!acc[integration.category]) {
        acc[integration.category] = [];
      }
      acc[integration.category].push(integration);
      return acc;
    },
    {} as Record<string, Integration[]>
  );

  return (
    <div
      ref={containerRef}
      className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800"
      role="region"
      aria-label="Integration platforms"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-slate-900 dark:text-white">
            Trusted by Industry Leaders
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            We integrate with the platforms you already use. Pre-built adapters for 10+ platforms—set up in 5 minutes.
          </p>
        </div>

        {Object.entries(groupedIntegrations).map(([category, items], categoryIndex) => (
          <div key={category} className="mb-12 last:mb-0">
            <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white text-center">
              {categories[category as keyof typeof categories]}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((integration, index) => (
                <div
                  key={integration.name}
                  className={cn(
                    "group relative flex flex-col items-center justify-center p-6",
                    "bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700",
                    "shadow-sm transition-all duration-300",
                    "hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600",
                    "hover:scale-105",
                    isVisible
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-4 scale-95",
                    integration.status === "coming-soon" && "opacity-60"
                  )}
                  style={{
                    transitionDelay: prefersReducedMotion
                      ? "0ms"
                      : `${categoryIndex * 200 + index * 100}ms`,
                  }}
                  role="listitem"
                  aria-label={`${integration.name} integration`}
                >
                  <div className="relative w-full h-12 mb-2 flex items-center justify-center">
                    <Image
                      src={integration.logo}
                      alt={integration.name}
                      width={100}
                      height={40}
                      className="object-contain max-h-10 opacity-80 group-hover:opacity-100 transition-opacity"
                      unoptimized
                    />
                  </div>
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 text-center">
                    {integration.name}
                  </p>
                  {integration.status === "available" && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full" />
                  )}
                  {integration.status === "coming-soon" && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                      Coming Soon
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Don't see your platform?{" "}
            <a
              href="/integrations/request"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Request an integration
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
