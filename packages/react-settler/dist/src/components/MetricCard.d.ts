/**
 * MetricCard
 * Displays a key reconciliation metric
 */
export interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    className?: string;
}
export declare function MetricCard({ title, value, subtitle, trend, className }: MetricCardProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=MetricCard.d.ts.map