"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, MessageSquare, BookOpen, Mail, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Floating Help Button Component
 *
 * Provides quick access to help resources, support, and documentation.
 * Always visible in bottom-right corner for easy access.
 */
export function FloatingHelpButton() {
  const [isOpen, setIsOpen] = useState(false);

  const helpOptions = [
    {
      icon: BookOpen,
      label: "Documentation",
      href: "/docs",
      description: "Browse guides and API reference",
    },
    {
      icon: MessageSquare,
      label: "Support",
      href: "/support",
      description: "Get help from our team",
    },
    {
      icon: FileText,
      label: "Cookbooks",
      href: "/cookbooks",
      description: "Ready-to-use examples",
    },
    {
      icon: Mail,
      label: "Contact Sales",
      href: "/enterprise",
      description: "Talk to our sales team",
    },
  ];

  return (
    <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom))] right-6 z-40">
      {/* Help Menu */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 w-80 bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 p-4 animate-in slide-in-from-bottom-2">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              How can we help?
            </h3>
            {helpOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Link
                  key={option.href}
                  href={option.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg",
                    "hover:bg-slate-50 dark:hover:bg-slate-800",
                    "transition-colors duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                >
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {option.description}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                </Link>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              href="/support/contact"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Need more help? Contact us →
            </Link>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg",
          "bg-gradient-to-r from-blue-600 to-indigo-600",
          "hover:from-blue-700 hover:to-indigo-700",
          "text-white",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isOpen && "rotate-45"
        )}
        aria-label={isOpen ? "Close help menu" : "Open help menu"}
        aria-expanded={isOpen}
      >
        <HelpCircle className="w-6 h-6" />
      </Button>
    </div>
  );
}
