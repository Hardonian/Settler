// Type declarations for marketing components to ensure TypeScript can resolve
// dynamic imports correctly when using path aliases with moduleResolution: "bundler"
// These declarations map the path alias imports to the actual component files

declare module '@/components/marketing/InvestorMetrics' {
  import { InvestorMetrics } from './InvestorMetrics';
  export { InvestorMetrics };
}

declare module '@/components/marketing/LiveMetricsCounter' {
  import { LiveMetricsCounter } from './LiveMetricsCounter';
  export { LiveMetricsCounter };
}

declare module '@/components/marketing/ValueProposition' {
  import { ValueProposition } from './ValueProposition';
  export { ValueProposition };
}

declare module '@/components/marketing/SocialProofCounter' {
  import { SocialProofCounter } from './SocialProofCounter';
  export { SocialProofCounter };
}

declare module '@/components/marketing/UrgencyBanner' {
  import { UrgencyBanner } from './UrgencyBanner';
  import type { UrgencyBannerProps } from './UrgencyBanner';
  export { UrgencyBanner };
  export type { UrgencyBannerProps };
}

declare module '@/components/marketing/InvestorPitch' {
  import { InvestorPitch } from './InvestorPitch';
  export { InvestorPitch };
}

declare module '@/components/marketing/TestimonialCarousel' {
  import { TestimonialCarousel } from './TestimonialCarousel';
  export { TestimonialCarousel };
}

declare module '@/components/marketing/InfographicSection' {
  import { InfographicSection } from './InfographicSection';
  export { InfographicSection };
}

declare module '@/components/marketing/ROICalculator' {
  import { ROICalculator } from './ROICalculator';
  export { ROICalculator };
}

declare module '@/components/marketing/ComparisonTable' {
  import { ComparisonTable } from './ComparisonTable';
  export { ComparisonTable };
}
