import { NextResponse } from "next/server";

const ADAPTERS = [
  { id: "stripe", name: "Stripe" },
  { id: "shopify", name: "Shopify" },
  { id: "quickbooks", name: "QuickBooks" },
];

const ADAPTER_CONFIG_SCHEMAS: Record<
  string,
  {
    required: string[];
    fields: Record<string, { description: string; type: string; example: string }>;
  }
> = {
  stripe: {
    required: ["apiKey"],
    fields: {
      apiKey: { description: "Stripe Secret Key", type: "password", example: "sk_test_..." },
      webhookSecret: {
        description: "Webhook Secret (optional)",
        type: "password",
        example: "whsec_...",
      },
    },
  },
  shopify: {
    required: ["apiKey", "shopDomain"],
    fields: {
      apiKey: { description: "Shopify API Key", type: "text", example: "shpat_..." },
      shopDomain: { description: "Shop Domain", type: "text", example: "your-store.myshopify.com" },
      webhookSecret: { description: "Webhook Secret (optional)", type: "password", example: "..." },
    },
  },
  quickbooks: {
    required: ["clientId", "clientSecret", "realmId", "accessToken", "refreshToken"],
    fields: {
      clientId: { description: "Client ID", type: "text", example: "..." },
      clientSecret: { description: "Client Secret", type: "password", example: "..." },
      realmId: { description: "Realm ID", type: "text", example: "..." },
      accessToken: { description: "Access Token", type: "password", example: "..." },
      refreshToken: { description: "Refresh Token", type: "password", example: "..." },
    },
  },
};

function getSuggestedRules(sourceAdapter: string, targetAdapter: string) {
  if (sourceAdapter === "shopify" && targetAdapter === "stripe") {
    return [
      {
        field: "order_id",
        type: "exact",
        description: "Match Shopify order ID with Stripe payment metadata",
      },
      {
        field: "amount",
        type: "exact",
        tolerance: 0.01,
        description: "Match amounts within $0.01 tolerance",
      },
      {
        field: "date",
        type: "range",
        days: 1,
        description: "Allow 1 day difference for processing delays",
      },
    ];
  }
  return [
    { field: "transaction_id", type: "exact", description: "Match transaction IDs exactly" },
    {
      field: "amount",
      type: "exact",
      tolerance: 0.01,
      description: "Match amounts within tolerance",
    },
  ];
}

export async function GET() {
  const steps = [
    {
      step: 1,
      title: "Choose Source Platform",
      description: "Where are your transactions coming from?",
      type: "select",
      options: ADAPTERS.map((a) => ({
        value: a.id,
        label: a.name,
        description: `Reconcile ${a.name} transactions`,
      })),
      required: true,
    },
    {
      step: 2,
      title: "Choose Target Platform",
      description: "Where should transactions be matched against?",
      type: "select",
      options: ADAPTERS.map((a) => ({
        value: a.id,
        label: a.name,
        description: `Match against ${a.name} transactions`,
      })),
      required: true,
    },
    {
      step: 3,
      title: "Configure Source Connection",
      description: "Enter your source platform credentials",
      type: "form",
      fields: [], // Dynamic based on selection
      required: true,
    },
    {
      step: 4,
      title: "Configure Target Connection",
      description: "Enter your target platform credentials",
      type: "form",
      fields: [], // Dynamic based on selection
      required: true,
    },
    {
      step: 5,
      title: "Configure Matching Rules",
      description: "How should transactions be matched?",
      type: "rules-builder",
      suggestions: [], // Dynamic based on selection
      required: true,
    },
  ];

  return NextResponse.json({
    data: steps,
    totalSteps: steps.length,
  });
}
