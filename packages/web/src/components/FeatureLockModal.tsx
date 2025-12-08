"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// import { FeatureComparison } from "@/components/FeatureComparison";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

interface FeatureLockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: {
    name: string;
    description: string;
    benefits: string[];
  };
  currentPlan?: string;
}

export function FeatureLockModal({ open, onOpenChange, feature }: FeatureLockModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle>Unlock {feature.name}</DialogTitle>
              <DialogDescription className="mt-1">
                This feature requires a Commercial plan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              What you&apos;ll get:
            </h3>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              {feature.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{feature.description}</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-sm font-semibold mb-2">Upgrade to Commercial includes:</p>
              <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-400">
                <li>• Unlimited reconciliations (vs 1,000/month)</li>
                <li>• All advanced features unlocked</li>
                <li>• Event-driven webhooks</li>
                <li>• Extended log retention</li>
                <li>• Priority email support</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/pricing">Upgrade to Commercial</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
