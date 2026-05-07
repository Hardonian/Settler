/**
 * Data Gravity Analyzer Utilities
 */

/**
 * Detect linear trend
 */
export function detectLinearTrend(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n === 0) {
    return { slope: 0, intercept: 0 };
  }
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => {
    const value = values[i];
    return sum + xi * (value ?? 0);
  }, 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Calculate trend from historical values
 */
export function calculateTrend(
  historicalValues: Array<{ date: string; value: number }>
): "increasing" | "decreasing" | "stable" | "volatile" {
  if (historicalValues.length < 2) return "stable";

  const values = historicalValues.map((v) => v.value);
  const trend = detectLinearTrend(values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const threshold = avg * 0.1;

  if (Math.abs(trend.slope) < threshold) {
    // Check volatility
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return stdDev / avg > 0.3 ? "volatile" : "stable";
  }

  return trend.slope > 0 ? "increasing" : "decreasing";
}

/**
 * Calculate confidence based on data quality
 */
export function calculateConfidence(
  historicalValues: Array<{ date: string; value: number }>
): number {
  if (historicalValues.length === 0) return 0;

  // More data points = higher confidence
  const dataPointsScore = Math.min(historicalValues.length / 100, 1);

  // Consistency = higher confidence
  const values = historicalValues.map((v) => v.value);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const consistencyScore = Math.max(0, 1 - stdDev / avg);

  // Recency = higher confidence (more recent data is better)
  const now = new Date();
  const lastValue = historicalValues[historicalValues.length - 1];
  const daysSinceLastUpdate = lastValue
    ? (now.getTime() - new Date(lastValue.date).getTime()) / (1000 * 60 * 60 * 24)
    : 30; // Default to max if no data
  const recencyScore = Math.max(0, 1 - daysSinceLastUpdate / 30);

  return dataPointsScore * 0.4 + consistencyScore * 0.4 + recencyScore * 0.2;
}

/**
 * Analyze patterns in historical data
 */
export function analyzePatterns(
  historical: any[]
): Array<{ type: string; pattern: Record<string, unknown> }> {
  const patterns: Array<{ type: string; pattern: Record<string, unknown> }> = [];

  // Simple pattern detection: recurring values, trends, cycles
  const values = historical.map((h) => Number(h.quantity) || 0);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Detect volatility
  if (stdDev / avg > 0.3) {
    patterns.push({
      type: "volatile",
      pattern: {
        average: avg,
        stdDev,
        coefficientOfVariation: stdDev / avg,
      },
    });
  }

  // Detect trends (simple linear regression)
  if (values.length >= 5) {
    const trend = detectLinearTrend(values);
    if (Math.abs(trend.slope) > avg * 0.1) {
      patterns.push({
        type: "trend",
        pattern: {
          slope: trend.slope,
          direction: trend.slope > 0 ? "increasing" : "decreasing",
          strength: Math.abs(trend.slope) / avg,
        },
      });
    }
  }

  return patterns;
}
