"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { TextReveal, TextRevealHeading } from "@/components/ui/TextReveal";
import { ParallaxBackground, ParallaxBlobs } from "@/components/ui/ParallaxBackground";
import {
  Github,
  Code,
  BookOpen,
  Bug,
  Sparkles,
  Users,
  Award,
  Heart,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const contributionTypes = [
  {
    icon: Code,
    title: "Build Adapters",
    description: "Create adapters for new platforms. We provide templates and documentation.",
    href: "/docs/integrations",
    gradient: "from-blue-500 to-cyan-500",
    badge: "Popular",
  },
  {
    icon: Bug,
    title: "Fix Bugs",
    description: "Report issues or submit fixes. Help improve stability and performance.",
    href: "https://github.com/shardie-github/Settler-API/issues",
    gradient: "from-red-500 to-orange-500",
    external: true,
  },
  {
    icon: BookOpen,
    title: "Improve Docs",
    description: "Write guides, improve examples, or translate documentation.",
    href: "/docs",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Sparkles,
    title: "New Features",
    description: "Propose and build new features. Join our Discord to discuss ideas.",
    href: "https://discord.gg/settler",
    gradient: "from-purple-500 to-pink-500",
    external: true,
  },
];

const waysToContribute = [
  {
    step: 1,
    title: "Fork the Repository",
    description: "Fork the Settler API repository on GitHub",
    action: "Fork on GitHub",
    href: "https://github.com/shardie-github/Settler-API",
    external: true,
  },
  {
    step: 2,
    title: "Create a Branch",
    description: "Create a feature branch for your contribution",
    action: "View Guide",
    href: "/docs",
  },
  {
    step: 3,
    title: "Make Changes",
    description: "Implement your changes following our coding standards",
    action: "See Standards",
    href: "/docs",
  },
  {
    step: 4,
    title: "Submit PR",
    description: "Submit a pull request with a clear description",
    action: "Submit PR",
    href: "https://github.com/shardie-github/Settler-API/pulls",
    external: true,
  },
];

export default function ContributorsPage() {
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

  return (
    <AnimatedPageWrapper aria-label="Contributors page">
      <Navigation />

      {/* Hero Section */}
      <section
        className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[60vh] flex items-center"
        aria-labelledby="hero-heading"
      >
        <ParallaxBackground>
          <ParallaxBlobs count={4} />
        </ParallaxBackground>

        <div className="max-w-7xl mx-auto relative z-10">
          <AnimatedHero
            badge="Open Source"
            title="Contributors"
            description="Help build the future of financial reconciliation. Contribute code, build adapters, improve docs, or report bugs."
          />

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
              <a href="https://github.com/shardie-github/Settler-API" target="_blank" rel="noopener noreferrer">
                View on GitHub <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/community">Back to Community</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Contribution Types */}
      <section
        ref={containerRef}
        className="py-20 px-4 sm:px-6 lg:px-8"
        aria-labelledby="contribution-types-heading"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <TextRevealHeading
              as="h2"
              id="contribution-types-heading"
              text="Ways to Contribute"
              className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white"
              delay={0}
              staggerDelay={0.02}
            />
            <TextReveal
              text="Choose how you'd like to contribute to Settler"
              className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
              delay={0.2}
              staggerDelay={0.01}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contributionTypes.map((type, index) => {
              const Icon = type.icon;
              const content = (
                <SpotlightCard
                  className={cn(
                    "p-6 h-full transition-all duration-300 hover:shadow-xl hover:scale-105",
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-4"
                  )}
                  style={{
                    transitionDelay: `${index * 0.1}s`,
                  }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center text-white flex-shrink-0",
                        type.gradient
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {type.title}
                        </h3>
                        {type.badge && (
                          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {type.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm md:text-base leading-relaxed">
                        {type.description}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild={!type.external}>
                    {type.external ? (
                      <a
                        href={type.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        Learn More <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link href={type.href}>Learn More</Link>
                    )}
                  </Button>
                </SpotlightCard>
              );

              return type.external ? (
                <a key={index} href={type.href} target="_blank" rel="noopener noreferrer" className="block">
                  {content}
                </a>
              ) : (
                <Link key={index} href={type.href}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How to Contribute Steps */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <TextRevealHeading
              as="h2"
              text="Getting Started"
              className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white"
              delay={0}
              staggerDelay={0.02}
            />
            <TextReveal
              text="Follow these steps to make your first contribution"
              className="text-lg text-slate-600 dark:text-slate-400"
              delay={0.2}
              staggerDelay={0.01}
            />
          </div>

          <div className="space-y-6">
            {waysToContribute.map((way, index) => (
              <SpotlightCard
                key={index}
                className="p-6 transition-all duration-300 hover:shadow-lg"
                style={{
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? "translateX(0)" : "translateX(-20px)",
                  transition: `opacity 0.6s ease-out ${index * 0.1 + 0.3}s, transform 0.6s ease-out ${index * 0.1 + 0.3}s`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {way.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                      {way.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                      {way.description}
                    </p>
                    <Button variant="outline" size="sm" asChild={!way.external}>
                      {way.external ? (
                        <a
                          href={way.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          {way.action} <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <Link href={way.href}>{way.action}</Link>
                      )}
                    </Button>
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <TextRevealHeading
              as="h2"
              text="Our Community"
              className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white"
              delay={0}
              staggerDelay={0.02}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Users, value: "500+", label: "Contributors" },
              { icon: Code, value: "50+", label: "Adapters" },
              { icon: Github, value: "100+", label: "PRs Merged" },
              { icon: Award, value: "10M+", label: "Transactions" },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <SpotlightCard
                  key={index}
                  className="p-6 text-center transition-all duration-300 hover:scale-105"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? "translateY(0)" : "translateY(20px)",
                    transition: `opacity 0.6s ease-out ${index * 0.1 + 0.5}s, transform 0.6s ease-out ${index * 0.1 + 0.5}s`,
                  }}
                >
                  <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{stat.label}</div>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <ParallaxBackground speed={0.2}>
          <ParallaxBlobs count={3} />
        </ParallaxBackground>
        <div className="max-w-4xl mx-auto relative z-10">
          <SpotlightCard className="p-10 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">
              Ready to Contribute?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              Join our open source community and help build the future of financial reconciliation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                <a href="https://github.com/shardie-github/Settler-API" target="_blank" rel="noopener noreferrer">
                  View on GitHub <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://discord.gg/settler" target="_blank" rel="noopener noreferrer">
                  Join Discord <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </div>
          </SpotlightCard>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
