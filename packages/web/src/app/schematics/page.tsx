"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { AnimatedPageWrapper } from "@/components/AnimatedPageWrapper";
import { AnimatedHero } from "@/components/AnimatedHero";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";
import { Shield, Database, Zap, GitBranch, Layers } from "lucide-react";

export default function Schematics() {
  const [selectedSchematic, setSelectedSchematic] = useState<string | null>(null);

  const schematics = [
    {
      id: "auth-flow",
      title: "Authentication Flow",
      description: "Complete authentication and authorization flow with Supabase.",
      category: "Authentication",
      icon: Shield,
      mermaid: `graph TD
    A[User Visits] --> B{Authenticated?}
    B -->|No| C[Show Public Mode]
    B -->|Yes| D[Show Elevated Mode]
    C --> E[Guest Session]
    D --> F[User Session]
    E --> G[Public Content]
    F --> H[Personalized Content]
    G --> I[Optional: Sign In]
    I --> D`,
      tags: ["auth", "supabase", "session"],
    },
    {
      id: "console-data",
      title: "Console Data Fetch",
      description: "How Console fetches and displays data safely.",
      category: "Data Flow",
      icon: Database,
      mermaid: `graph LR
    A[Console Page] --> B{Env Check}
    B -->|Missing| C[Show Limited Mode]
    B -->|OK| D[Auth Check]
    D -->|No Auth| E[Public Content]
    D -->|Auth| F[Fetch User Data]
    F --> G{Success?}
    G -->|Yes| H[Show Full Console]
    G -->|No| E
    C --> E`,
      tags: ["console", "data", "fetch"],
    },
    {
      id: "error-boundary",
      title: "Error Boundary Flow",
      description: "How errors are caught and handled gracefully.",
      category: "Error Handling",
      icon: Zap,
      mermaid: `graph TD
    A[Component Error] --> B[Error Boundary]
    B --> C{Error Type?}
    C -->|Render Error| D[Show Error UI]
    C -->|Network Error| E[Show Degraded Mode]
    C -->|Auth Error| F[Show Public Mode]
    D --> G[Log Error]
    E --> H[Retry Option]
    F --> I[Sign In Option]
    G --> J[Report to Monitoring]`,
      tags: ["errors", "boundaries", "handling"],
    },
    {
      id: "qa-pipeline",
      title: "QA Pipeline Flow",
      description: "Automated link checking and smoke testing pipeline.",
      category: "CI/CD",
      icon: GitBranch,
      mermaid: `graph LR
    A[Code Push] --> B[Generate Route Registry]
    B --> C[Extract Links]
    C --> D[Check Dead Links]
    D --> E{Dead Links?}
    E -->|Yes| F[Fail Build]
    E -->|No| G[Run Smoke Tests]
    G --> H{All Pass?}
    H -->|No| F
    H -->|Yes| I[Deploy]`,
      tags: ["qa", "ci-cd", "testing"],
    },
    {
      id: "content-provider",
      title: "Content Provider Pattern",
      description: "How content is loaded from Supabase with local fallback.",
      category: "Data",
      icon: Layers,
      mermaid: `graph TD
    A[Request Content] --> B[Try Supabase]
    B --> C{Success?}
    C -->|Yes| D[Return Content]
    C -->|No| E[Timeout?]
    E -->|Yes| F[Use Local Content]
    E -->|No| G[Retry]
    G --> C
    F --> D
    D --> H[Render Page]`,
      tags: ["content", "fallback", "supabase"],
    },
  ];

  const selectedSchematicData = schematics.find((s) => s.id === selectedSchematic);

  return (
    <AnimatedPageWrapper aria-label="Workflow schematics">
      <Navigation />

      {/* Breadcrumbs */}
      <section className="px-4 sm:px-6 lg:px-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs items={[{ label: "Schematics" }]} />
        </div>
      </section>

      {/* Hero Section */}
      <AnimatedHero
        badge="Workflow Diagrams"
        title="Agent Workflow Schematics"
        description="Visual diagrams of key system flows, authentication patterns, and data processing workflows."
      />

      {/* Schematics Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schematics.map((schematic) => {
              const Icon = schematic.icon;
              return (
                <Card
                  key={schematic.id}
                  className="h-full cursor-pointer bg-white dark:bg-card border-border/40 dark:border-border transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700"
                  onClick={() => setSelectedSchematic(schematic.id)}
                >
                  <div className="flex flex-col h-full">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 p-2.5 mb-4 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{schematic.category}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-foreground">
                      {schematic.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 flex-grow text-sm leading-relaxed">
                      {schematic.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {schematic.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground hover:bg-muted/30 dark:hover:bg-card/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSchematic(schematic.id);
                      }}
                    >
                      View Diagram →
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Selected Schematic Detail Modal */}
      {selectedSchematicData && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSchematic(null)}
        >
          <Card
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-card border border-border/40 dark:border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{selectedSchematicData.category}</Badge>
                  </div>
                  <CardTitle className="text-2xl text-foreground mb-2">
                    {selectedSchematicData.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {selectedSchematicData.description}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSchematic(null)}
                  className="ml-4"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-foreground mb-4">
                  Mermaid Diagram
                </h4>
                <div className="bg-muted/20 p-4 rounded-lg border border-border/40 dark:border-border">
                  <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                    {selectedSchematicData.mermaid}
                  </pre>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Copy this Mermaid code to visualize in{" "}
                  <a
                    href="https://mermaid.live"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Mermaid Live Editor
                  </a>
                </p>
              </div>
              <div className="flex gap-3 pt-4 border-t border-border/40 dark:border-border">
                <Button
                  asChild
                  className="bg-card dark:bg-white text-white dark:text-foreground hover:bg-card/80 dark:hover:bg-muted/30"
                >
                  <Link href="/console">Open Console</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-border"
                  asChild
                >
                  <Link href="/cookbook">View Cookbooks</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-border/40 dark:border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-3 text-foreground">
            Want to see more workflows?
          </h2>
          <p className="text-muted-foreground mb-6">
            Explore our cookbook for code examples and implementation guides.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Link href="/cookbook">View Cookbook</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-border"
              asChild
            >
              <Link href="/docs">Read Docs</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </AnimatedPageWrapper>
  );
}
