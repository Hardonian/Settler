// Type declarations for marketing components to help TypeScript resolve dynamic imports
declare module '@/components/marketing/InvestorMetrics' {
  export function InvestorMetrics(): JSX.Element;
}

declare module '@/components/marketing/LiveMetricsCounter' {
  export function LiveMetricsCounter(): JSX.Element;
}

declare module '@/components/marketing/ValueProposition' {
  export function ValueProposition(): JSX.Element;
}

declare module '@/components/marketing/SocialProofCounter' {
  export function SocialProofCounter(): JSX.Element;
}

declare module '@/components/marketing/UrgencyBanner' {
  export interface UrgencyBannerProps {
    variant?: 'default' | 'minimal' | 'prominent';
    className?: string;
  }
  export function UrgencyBanner(props: UrgencyBannerProps): JSX.Element;
}

declare module '@/components/marketing/InvestorPitch' {
  export function InvestorPitch(): JSX.Element;
}

declare module '@/components/marketing/TestimonialCarousel' {
  export function TestimonialCarousel(): JSX.Element;
}

declare module '@/components/marketing/InfographicSection' {
  export function InfographicSection(): JSX.Element;
}

declare module '@/components/marketing/ROICalculator' {
  export interface ROICalculatorProps {
    className?: string;
  }
  export function ROICalculator(props: ROICalculatorProps): JSX.Element;
}

declare module '@/components/marketing/ComparisonTable' {
  export function ComparisonTable(): JSX.Element;
}
