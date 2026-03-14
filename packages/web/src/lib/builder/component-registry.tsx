"use client";

/**
 * Builder.io Component Registry
 * Registers custom components for use in Builder.io visual editor
 */

import { Builder } from "@builder.io/react";
import dynamic from "next/dynamic";

// Dynamically import components for better performance
const AnimatedCodeBlock = dynamic(
  () => import("@/components/AnimatedCodeBlock").then((mod) => mod.AnimatedCodeBlock),
  { ssr: false }
);
const ConversionCTA = dynamic(() =>
  import("@/components/ConversionCTA").then((mod) => mod.ConversionCTA)
);

/**
 * Register all custom components with Builder.io
 * This makes them available in the visual editor
 */
export function registerBuilderComponents() {
  // Register Animated Code Block
  Builder.registerComponent(AnimatedCodeBlock, {
    name: "AnimatedCodeBlock",
    inputs: [
      {
        name: "code",
        type: "longText",
        defaultValue: 'console.log("Hello World");',
        required: true,
      },
      {
        name: "language",
        type: "string",
        defaultValue: "typescript",
        enum: ["typescript", "javascript", "python", "json", "bash"],
      },
      {
        name: "title",
        type: "string",
        defaultValue: "Example Code",
      },
    ],
  });

  // Register Conversion CTA
  Builder.registerComponent(ConversionCTA, {
    name: "ConversionCTA",
    inputs: [
      {
        name: "variant",
        type: "string",
        enum: ["default", "gradient", "minimal"],
        defaultValue: "default",
      },
      {
        name: "heading",
        type: "string",
        defaultValue: "Ready to get started?",
      },
      {
        name: "subheading",
        type: "longText",
        defaultValue: "Start your free trial today",
      },
      {
        name: "primaryCTA",
        type: "object",
        subFields: [
          { name: "text", type: "string", defaultValue: "Start Free Trial" },
          { name: "href", type: "string", defaultValue: "/signup" },
        ],
      },
      {
        name: "secondaryCTA",
        type: "object",
        subFields: [
          { name: "text", type: "string", defaultValue: "View Pricing" },
          { name: "href", type: "string", defaultValue: "/pricing" },
        ],
      },
    ],
  });

  // Register basic UI components
  Builder.registerComponent(
    (props: { text: string; variant: "default" | "outline" | "ghost"; href?: string }) => {
      const buttonClass = `
        px-6 py-3 rounded-lg font-semibold transition-all
        ${props.variant === "default" ? "bg-primary text-white hover:bg-primary/90" : ""}
        ${props.variant === "outline" ? "border-2 border-primary text-primary hover:bg-primary/10" : ""}
        ${props.variant === "ghost" ? "text-primary hover:bg-primary/10" : ""}
      `;

      if (props.href) {
        return (
          <a href={props.href} className={buttonClass}>
            {props.text}
          </a>
        );
      }
      return <button className={buttonClass}>{props.text}</button>;
    },
    {
      name: "Button",
      inputs: [
        { name: "text", type: "string", defaultValue: "Click me", required: true },
        {
          name: "variant",
          type: "string",
          enum: ["default", "outline", "ghost"],
          defaultValue: "default",
        },
        { name: "href", type: "url" },
      ],
    }
  );

  // eslint-disable-next-line no-console
  console.log("✅ Builder.io components registered successfully");
}

// Auto-register components when this module is imported
if (typeof window !== "undefined") {
  registerBuilderComponents();
}
