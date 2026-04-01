"use client";

import React from "react";
import {
  CheckCircle,
  Info,
  Network,
  ShieldCheck,
  Circle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const OnboardingPage: React.FC = () => {
  return (
    <div className="max-w-lg mx-auto space-y-0 pb-8">
      {/* Progress header */}
      <div className="pt-2 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide">
            Step 1 of 4
          </Badge>
        </div>
        {/* Step progress bar */}
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === 0 ? "bg-primary" : "bg-border"
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Card shell */}
      <div className="panel p-6 sm:p-8 space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Set up your Workspace
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Let&apos;s configure your secure, audit-ready environment. First, give it an identity.
          </p>
        </div>

        <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
          {/* Workspace Name */}
          <div className="space-y-1.5">
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor="workspace-name"
            >
              Workspace Name
            </label>
            <div className="relative">
              <input
                className="input-field h-11 pr-10"
                id="workspace-name"
                placeholder="e.g. Acme Corp"
                type="text"
                defaultValue="Acme Corp"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Subdomain / Workspace URL */}
          <div className="space-y-1.5">
            <label
              className="block text-sm font-medium text-foreground"
              htmlFor="subdomain"
            >
              Workspace URL
            </label>
            <div className="flex rounded-[var(--ui-radius-md)] shadow-sm overflow-hidden border border-border focus-within:ring-2 focus-within:ring-ring">
              <span className="inline-flex items-center bg-muted/30 px-3 text-sm text-muted-foreground border-r border-border shrink-0">
                https://
              </span>
              <input
                className="block w-full min-w-0 flex-1 bg-background text-foreground px-3 h-11 text-sm focus:outline-none"
                id="subdomain"
                placeholder="acme"
                type="text"
                defaultValue="acme-production"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Your team will use this URL to access the platform.
            </p>
          </div>

          {/* Tenant Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-foreground">
                Tenant Mode
              </label>
              <button type="button" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Learn about tenant modes">
                <Info className="h-4 w-4" />
              </button>
            </div>

            {/* Option 1: Shared */}
            <label className="relative flex cursor-pointer rounded-xl border-2 border-primary bg-primary/8 p-4 transition-all">
              <input
                aria-labelledby="tenant-mode-0-label"
                defaultChecked
                className="sr-only"
                name="tenant-mode"
                type="radio"
                value="multi"
              />
              <span className="flex flex-1">
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-primary flex items-center gap-2" id="tenant-mode-0-label">
                    <Network className="h-4 w-4" aria-hidden="true" />
                    Shared Environment
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Cost-effective multi-tenant setup. Best for development and staging.
                  </span>
                </span>
              </span>
              <CheckCircle className="text-primary h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            </label>

            {/* Option 2: Isolated */}
            <label className="relative flex cursor-pointer rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all">
              <input
                aria-labelledby="tenant-mode-1-label"
                className="sr-only"
                name="tenant-mode"
                type="radio"
                value="dedicated"
              />
              <span className="flex flex-1">
                <span className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-foreground flex items-center gap-2" id="tenant-mode-1-label">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Isolated Environment
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Dedicated resources for strict compliance. Best for production.
                  </span>
                </span>
              </span>
              <Circle className="text-muted-foreground h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            </label>
          </div>

          {/* Audit-Ready Defaults */}
          <div className="pt-2 border-t border-border/60 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Audit-Ready Defaults
            </h3>

            {[
              {
                id: "soc2",
                label: "SOC2 Logging Preset",
                hint: "Enables 90-day retention",
                defaultChecked: true,
              },
              {
                id: "2fa",
                label: "Enforce 2FA",
                hint: "Require for all admins",
                defaultChecked: true,
              },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.hint}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id={item.id}
                    defaultChecked={item.defaultChecked}
                    className="sr-only peer"
                    type="checkbox"
                  />
                  <div className="w-10 h-5 rounded-full bg-border peer-focus:ring-2 peer-focus:ring-ring peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
            ))}
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
            >
              Save Draft
            </Button>
            <Button
              type="button"
              className="flex-[2] gap-2"
            >
              Next Step
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
