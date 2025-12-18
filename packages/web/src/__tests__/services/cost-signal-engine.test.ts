/**
 * Cost Signal Engine Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateCost, getCostBaseline } from '../../../../ops/cost_baselines';

describe('Cost Signal Engine', () => {
  describe('getCostBaseline', () => {
    it('should return baseline for valid source and type', () => {
      const baseline = getCostBaseline('vercel', 'edgeRequest');
      expect(baseline).toBeTruthy();
      expect(baseline?.unit).toBe('request');
      expect(baseline?.costPerUnit).toBeGreaterThan(0);
    });

    it('should return null for invalid source', () => {
      const baseline = getCostBaseline('invalid' as any, 'edgeRequest');
      expect(baseline).toBeNull();
    });

    it('should return null for invalid type', () => {
      const baseline = getCostBaseline('vercel', 'invalid');
      expect(baseline).toBeNull();
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost correctly', () => {
      const baseline = getCostBaseline('vercel', 'edgeRequest');
      expect(baseline).toBeTruthy();
      
      if (baseline) {
        const result = calculateCost(1000, baseline);
        expect(result.totalCost).toBeGreaterThan(0);
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should handle zero unit count', () => {
      const baseline = getCostBaseline('vercel', 'edgeRequest');
      expect(baseline).toBeTruthy();
      
      if (baseline) {
        const result = calculateCost(0, baseline);
        expect(result.totalCost).toBe(0);
      }
    });
  });
});
