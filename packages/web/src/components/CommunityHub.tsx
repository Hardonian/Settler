"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Github, MessageCircle, BookOpen, Code, Users, Zap, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CommunityLink {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  external?: boolean;
  gradient: string;
}

export function CommunityHub() {
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

  const communityLinks: CommunityLink[] = [
    {
      title: "GitHub",
      description: "Open source SDK, adapters, and core engine",
      href: "https://github.com/shardie-github/Settler-API",
      icon: <Github className="w-6 h-6" />,
      external: true,
      gradient: "from-slate-700 to-slate-900",
    },
    {
      title: "Discord",
      description: "Join 500+ developers in our community",
      href: "https://discord.gg/settler",
      icon: <MessageCircle className="w-6 h-6" />,
      external: true,
      gradient: "from-indigo-500 to-purple-600",
    },
    {
      title: "Documentation",
      description: "Complete API reference and guides",
      href: "/docs",
      icon: <BookOpen className="w-6 h-6" />,
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      title: "Contributors",
      description: "Build adapters, fix bugs, improve docs",
      href: "/community/contributors",
      icon: <Code className="w-6 h-6" />,
      gradient: "from-green-500 to-emerald-600",
    },
  ];

  const stats = [
    { icon: <Users className="w-5 h-5" />, value: "500+", label: "Community Members" },
    { icon: <Code className="w-5 h-5" />, value: "50+", label: "Open Source Adapters" },
    { icon: <Award className="w-5 h-5" />, value: "100+", label: "Contributors" },
    { icon: <Zap className="w-5 h-5" />, value: "10M+", label: "Transactions Processed" },
  ];

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      ref={containerRef}
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      role="region"
      aria-label="Community hub"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Join 500+ Developers Building with Settler
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Open source SDK and adapters. Active Discord community. Contribute code, build adapters, or get help from fellow developers.
          </p>
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={cn(
                "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center",
                "transition-all duration-500 hover:shadow-lg",
                isVisible
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 translate-y-4 scale-95"
              )}
              style={{
                transitionDelay: prefersReducedMotion ? "0ms" : `${index * 100}ms`,
              }}
            >
              <div className="flex items-center justify-center mb-2 text-blue-600 dark:text-blue-400">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Community Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {communityLinks.map((link, index) => {
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
                  transitionDelay: prefersReducedMotion ? "0ms" : `${index * 100 + 400}ms`,
                }}
              >
                <CardHeader>
                  <div
                    className={cn(
                      "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-4",
                      link.gradient
                    )}
                  >
                    {link.icon}
                  </div>
                  <CardTitle className="text-xl mb-2">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    asChild={!link.external}
                  >
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        Visit {link.title}
                        <Zap className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link href={link.href}>Get Started</Link>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );

            return link.external ? (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {content}
              </a>
            ) : (
              <Link key={index} href={link.href}>
                {content}
              </Link>
            );
          })}
        </div>

        {/* Open Source Badge */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-sm">
            <Heart className="w-6 h-6 text-red-500" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Open Source & Community-Driven
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                MIT Licensed SDK • AGPL Core Engine • Community Adapters
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
