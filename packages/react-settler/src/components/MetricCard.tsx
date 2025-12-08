/**
 * MetricCard
 * Displays a key reconciliation metric
 */

import { useCompilationContext } from '../context';

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  className
}: MetricCardProps) {
  const context = useCompilationContext();

  // In config mode, register widget
  if (context.mode === 'config') {
    const widgetId = `metric-${title.toLowerCase().replace(/\s+/g, '-')}`;
    if (!context.config.widgets) {
      context.config.widgets = {};
    }
    context.config.widgets[widgetId] = {
      id: widgetId,
      type: 'metric-card',
      title,
      props: {
        subtitle,
        trend
      }
    };
  }

  // In UI mode, render card
  if (context.mode === 'ui') {
    return (
      <div className={className} data-widget="metric-card">
        <div data-metric-title={title}>
          <h3>{title}</h3>
          <div data-metric-value={value} data-trend={trend}>
            {value}
          </div>
          {subtitle && <div data-metric-subtitle>{subtitle}</div>}
        </div>
      </div>
    );
  }

  // Config mode: return null (widget registered above)
  return null;
}
