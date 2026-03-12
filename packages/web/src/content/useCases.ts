import { BarChart3, Shield, Zap } from "lucide-react";
import type { ComponentType } from "react";

export type UseCaseBenefit = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

export type UseCase = {
  slug: string;
  title: string;
  description: string;
  hero: string;
  features: string[];
  benefits: UseCaseBenefit[];
  cta: string;
};

export const useCases: UseCase[] = [
  {
    slug: "ecommerce-reconciliation",
    title: "E-commerce Reconciliation",
    description:
      "Match orders, payments, and fulfillment events across Shopify, Stripe, and internal systems.",
    hero: "Automate e-commerce reconciliation with deterministic matching, refund handling, and fulfillment state evidence.",
    features: [
      "Match Shopify orders with Stripe payments",
      "Track refunds, disputes, and fee offsets",
      "Correlate fulfillment status across providers",
      "Export reconciliation evidence for accounting and audits",
    ],
    benefits: [
      {
        title: "Less manual review",
        description: "Reduce repetitive queue triage with deterministic matching policies",
        icon: Zap,
      },
      {
        title: "Audit-ready evidence",
        description: "Retain machine-verifiable run receipts for each settlement decision",
        icon: Shield,
      },
      {
        title: "Faster variance detection",
        description: "Surface mismatches early before they impact close cycles",
        icon: BarChart3,
      },
    ],
    cta: "Start setup",
  },
  {
    slug: "payment-reconciliation",
    title: "Payment Reconciliation",
    description: "Reconcile settlement data across processors and accounting backends.",
    hero: "Track multi-processor payment activity with deterministic joins, fee handling, and exception evidence.",
    features: [
      "Match Stripe and PayPal events against accounting records",
      "Track fee, dispute, and refund effects on settlement",
      "Attach run evidence to each exception decision",
      "Generate reviewer-friendly export artifacts",
    ],
    benefits: [
      {
        title: "Deterministic matching",
        description: "Standardize policy-driven joins across processors",
        icon: Zap,
      },
      {
        title: "Controls visibility",
        description: "Expose policy, operator actions, and evidence in one trail",
        icon: Shield,
      },
      {
        title: "Operational clarity",
        description: "Spot unresolved drift quickly with reproducible replay",
        icon: BarChart3,
      },
    ],
    cta: "Start setup",
  },
  {
    slug: "receipt-processing",
    title: "Receipt Processing",
    description: "Extract structured receipt data and verify downstream accounting mappings.",
    hero: "Convert receipts into structured records and validate mapping integrity before books are finalized.",
    features: [
      "Parse receipts and invoices into structured fields",
      "Capture extraction confidence and exception evidence",
      "Map normalized outputs into accounting pipelines",
      "Export artifacts for close-cycle verification",
    ],
    benefits: [
      {
        title: "Faster ingestion",
        description: "Automate intake while preserving extraction provenance",
        icon: Zap,
      },
      {
        title: "Traceable results",
        description: "Keep source-to-output lineage for every document",
        icon: Shield,
      },
      {
        title: "Consistent downstream data",
        description: "Reduce normalization drift before reconciliation runs",
        icon: BarChart3,
      },
    ],
    cta: "Try receipt parser",
  },
];

export const useCaseIndexCards = [
  {
    title: "Developer integration workflow",
    description: "Implement reconciliation in product code with SDK and API endpoints.",
    bullets: ["Create run definitions", "Version matching rules", "Trigger runs in CI"],
  },
  {
    title: "Finance operations workflow",
    description: "Detect and triage mismatches with deterministic, replayable records.",
    bullets: ["Daily exception queues", "Variance review", "Export reconciliation evidence"],
  },
  {
    title: "Platform operations workflow",
    description: "Operate run infrastructure and diagnostics from the control plane.",
    bullets: ["Run monitoring", "Failure taxonomy", "Remediation playbooks"],
  },
  {
    title: "Security and audit workflow",
    description: "Provide machine-verifiable evidence and action logs to reviewers.",
    bullets: ["Tenant-scoped access", "Audit artifacts", "Replay verification"],
  },
  {
    title: "Open-source adoption workflow",
    description: "Evaluate and self-host core reconciliation workflows.",
    bullets: ["Repository quickstart", "CLI-driven demos", "Local replay checks"],
  },
  {
    title: "Enterprise evaluation workflow",
    description: "Assess packaging, governance controls, and support requirements.",
    bullets: [
      "Deployment model review",
      "Security architecture review",
      "Commercial packaging path",
    ],
  },
];

export function getUseCaseBySlug(slug: string) {
  return useCases.find((useCase) => useCase.slug === slug);
}
