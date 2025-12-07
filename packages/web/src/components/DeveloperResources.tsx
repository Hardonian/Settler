"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Code2,
  BookOpen,
  Terminal,
  Play,
  FileText,
  Zap,
  Github,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Resource {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  category: "docs" | "tools" | "examples" | "community";
  external?: boolean;
  badge?: string;
}

export function DeveloperResources() {
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

  const resources: Resource[] = [
    {
      title: "API Reference",
      description: "Complete API documentation with examples",
      href: "/docs/api",
      icon: <FileText className="w-6 h-6" />,
      category: "docs",
    },
    {
      title: "Quick Start Guide",
      description: "Get started in 5 minutes",
      href: "/docs/quickstart",
      icon: <Zap className="w-6 h-6" />,
      category: "docs",
      badge: "Start Here",
    },
    {
      title: "SDK Documentation",
      description: "TypeScript SDK reference and examples",
      href: "/docs/sdk",
      icon: <Code2 className="w-6 h-6" />,
      category: "docs",
    },
    {
      title: "Web Playground",
      description: "Test integrations without code",
      href: "/playground",
      icon: <Play className="w-6 h-6" />,
      category: "tools",
    },
    {
      title: "CLI Tool",
      description: "Command-line interface for Settler",
      href: "/docs/cli",
      icon: <Terminal className="w-6 h-6" />,
      category: "tools",
    },
    {
      title: "Code Examples",
      description: "Real-world integration examples",
      href: "/docs/examples",
      icon: <BookOpen className="w-6 h-6" />,
      category: "examples",
    },
    {
      title: "GitHub Repository",
      description: "Source code, issues, and contributions",
      href: "https://github.com/shardie-github/Settler-API",
      icon: <Github className="w-6 h-6" />,
      category: "community",
      external: true,
    },
    {
      title: "Discord Community",
      description: "Get help from developers",
      href: "https://discord.gg/settler",
      icon: <MessageCircle className="w-6 h-6" />,
      category: "community",
      external: true,
    },
  ];

  const categories = {
    docs: { label: "Documentation", color: "from-blue-500 to-cyan-600" },
    tools: { label: "Tools", color: "from-purple-500 to-pink-600" },
    examples: { label: "Examples", color: "from-green-500 to-emerald-600" },
    community: { label: "Community", color: "from-orange-500 to-red-600" },
  };

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      ref={containerRef}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900"
      role="region"
      aria-label="Developer resources"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Developer Resources
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Everything you need to build with Settler. Documentation, tools, examples, and
            community support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((resource, index) => {
            const category = categories[resource.category];
            const content = (
              <Card
                className={cn(
                  "h-full transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer",
                  "border-2 hover:border-blue-300 dark:hover:border-blue-600",
                  isVisible
                    ? "opacity-100 translate-y-0 scale-100"
                    : "opacity-0 translate-y-4 scale-95"
                )}
                style={{
                  transitionDelay: prefersReducedMotion ? "0ms" : `${index * 100}ms`,
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                        category.color
                      )}
                    >
                      {resource.icon}
                    </div>
                    {resource.badge && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">
                        {resource.badge}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-lg mb-2">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" asChild={!resource.external}>
                    {resource.external ? (
                      <a
                        href={resource.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        Visit
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link href={resource.href}>View</Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );

            return resource.external ? (
              <a
                key={index}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {content}
              </a>
            ) : (
              <Link key={index} href={resource.href}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
