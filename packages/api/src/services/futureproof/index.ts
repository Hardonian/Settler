/**
 * Long-Range Futureproofing Services
 * 
 * Part 13: Long-Range Futureproofing
 */

export { ModelAgnosticism } from './model-agnosticism';
export { HardwareFlexibility } from './hardware-flexibility';
export { APIEvolution } from './api-evolution';
export { BehavioralAdaptation } from './behavioral-adaptation';

export type { LLMProvider, ModelAdapter } from './model-agnosticism';
export type { RuntimeConfig, ExecutionEnvironment } from './hardware-flexibility';
export type { FunctionCallingSpec, TypedJSONSchema, ReconDSL } from './api-evolution';
export type { SystemDefaults, AdaptationEvent } from './behavioral-adaptation';
