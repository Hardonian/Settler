/**
 * Edge AI Core - Brand-Neutral Shared Engine
 *
 * This module provides shared technical components for Edge AI functionality.
 * It is used by both AIAS and Settler.dev, but contains NO product-specific
 * branding, pricing, or business logic.
 *
 * Architecture Principle: Internal cohesion, external separation
 */

// Device Profiling
export * from "./device-profiling";

// Quantization (export first to avoid duplicate type exports)
export * from "./quantization";

// Model Optimization (imports QuantizationType from quantization)
export * from "./model-optimization";

// Inference Engines
export * from "./inference";

// Runtime Selection
export * from "./runtime-selector";

// Edge Node Deployment
export * from "./deployment";

// Model Distribution
export * from "./model-distribution";

// Security
export * from "./security";

// Deterministic Mathematical Discrepancy Classification
export * from "./discrepancy-classifier";

// Adjudication Memory -> Rule Synthesis Feedback Loop
export * from "./rule-synthesizer";
