/**
 * Contributors Page
 *
 * Showcases community contributors and how to get involved
 */

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { SpotlightCard } from "@/components/ui/SpotlightCard";
import { Github, Code, BookOpen, MessageCircle, Heart } from "lucide-react";
import Link from "next/link";

export default function ContributorsPage() {
  const contributionTypes = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "Build Adapters",
      description: "Create integrations for payment platforms, e-commerce systems, and more.",
      href: "/docs/integrations",
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Improve Documentation",
      description: "Help make our docs clearer, add examples, or fix typos.",
      href: "https://github.com/shardie-github/Settler-API",
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Help Others",
      description: "Answer questions in Discord and help fellow developers.",
      href: "https://discord.gg/settler",
    },
    {
      icon: <Github className="w-6 h-6" />,
      title: "Fix Bugs",
      description: "Report issues, submit PRs, and help improve the core engine.",
      href: "https://github.com/shardie-github/Settler-API",
    },
  ];

  return (
    <AnimatedPageWrapper aria-label="Contributors">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-electric-cyan dark:via-electric-purple dark:to-electric-blue bg-clip-text text-transparent">
            Contributors
          </h1>
          <p className="text-xl text-slate-700 dark:text-slate-300">
            Join 100+ contributors building the future of payment reconciliation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {contributionTypes.map((type, index) => (
            <SpotlightCard
              key={index}
              className="p-6"
              style={{
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
                  {type.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                    {type.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {type.description}
                  </p>
                  <Link
                    href={type.href}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Get Started →
                  </Link>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-green-200 dark:border-green-800 shadow-sm">
            <Heart className="w-6 h-6 text-red-500" />
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Thank You to All Contributors
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your contributions make Settler better for everyone
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </AnimatedPageWrapper>
  );
}
