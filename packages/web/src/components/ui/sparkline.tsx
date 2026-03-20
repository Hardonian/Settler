/**
 * Sparkline — Lightweight inline trend chart (pure SVG, zero dependencies)
 *
 * Renders a small line or bar sparkline from an array of numeric values.
 * Designed for stat cards, table rows, and KPI strips.
 *
 * Design rules:
 * - No axis labels, no tooltips, no animation noise
 * - Color signals trend direction
 * - Accessible: aria-label conveys summary
 * - Works in both light and dark mode via CSS variables
 *
 * Usage:
 *   <Sparkline values={[10, 14, 9, 18, 22, 17, 25]} label="Run volume last 7 days" />
 *   <Sparkline values={runs} variant="bar" tone="success" width={80} height={28} />
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SparklineProps {
  /** Data points to plot */
  values: number[];
  /** Accessible description of what the chart shows */
  label: string;
  /** Chart variant */
  variant?: "line" | "bar";
  /** Color tone */
  tone?: "default" | "success" | "warning" | "danger";
  /** Width in px */
  width?: number;
  /** Height in px */
  height?: number;
  /** Additional className */
  className?: string;
}

const toneStroke: Record<NonNullable<SparklineProps["tone"]>, string> = {
  default: "var(--primary)",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};

const toneFill: Record<NonNullable<SparklineProps["tone"]>, string> = {
  default: "var(--primary-light)",
  success: "rgba(34,197,94,0.10)",
  warning: "rgba(245,158,11,0.10)",
  danger: "rgba(239,68,68,0.10)",
};

function buildLinePath(
  values: number[],
  width: number,
  height: number,
  padV = 3
): { line: string; area: string } {
  if (values.length < 2) return { line: "", area: "" };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const scaleY = (v: number) =>
    padV + ((max - v) / range) * (height - padV * 2);

  const points = values.map((v, i) => [i * stepX, scaleY(v)] as [number, number]);

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = [
    `M${points[0][0].toFixed(1)},${height}`,
    ...points.map(([x, y]) => `L${x.toFixed(1)},${y.toFixed(1)}`),
    `L${points[points.length - 1][0].toFixed(1)},${height}`,
    "Z",
  ].join(" ");

  return { line, area };
}

export function Sparkline({
  values,
  label,
  variant = "line",
  tone = "default",
  width = 64,
  height = 24,
  className,
}: SparklineProps) {
  const stroke = toneStroke[tone];
  const fill = toneFill[tone];

  if (!values || values.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        aria-label={label}
        role="img"
        className={cn("opacity-20", className)}
      >
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={stroke} strokeWidth={1} />
      </svg>
    );
  }

  if (variant === "bar") {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const barW = Math.max(2, (width / values.length) - 1);
    const gap = (width - barW * values.length) / (values.length - 1 || 1);

    return (
      <svg
        width={width}
        height={height}
        aria-label={label}
        role="img"
        className={className}
      >
        {values.map((v, i) => {
          const barH = Math.max(2, ((v - min) / range) * (height - 2) + 2);
          const x = i * (barW + gap);
          const y = height - barH;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={barH}
              fill={stroke}
              opacity={0.7}
              rx={1}
            />
          );
        })}
      </svg>
    );
  }

  // Line variant
  const { line, area } = buildLinePath(values, width, height);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label={label}
      role="img"
      className={cn("overflow-visible", className)}
    >
      {/* Area fill */}
      {area && (
        <path d={area} fill={fill} />
      )}
      {/* Line */}
      {line && (
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Terminal dot */}
      {values.length > 0 && (() => {
        const lastVal = values[values.length - 1];
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const x = width;
        const y = 3 + ((max - lastVal) / range) * (height - 6);
        return (
          <circle cx={x} cy={y} r={2} fill={stroke} />
        );
      })()}
    </svg>
  );
}
