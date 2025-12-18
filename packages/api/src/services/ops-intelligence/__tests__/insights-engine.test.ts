/**
 * Insights Engine Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateInsights, InsightType } from '../insights-engine';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        gte: jest.fn(() => ({
          lt: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

describe('Insights Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate insights for cost type', async () => {
    const timeWindow = {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    const result = await generateInsights(
      'https://test.supabase.co',
      'test-key',
      timeWindow
    );

    expect(result).toBeDefined();
    expect(result.insights).toBeInstanceOf(Array);
    expect(result.generatedAt).toBeInstanceOf(Date);
  });

  it('should generate insights with correct structure', async () => {
    const timeWindow = {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    const result = await generateInsights(
      'https://test.supabase.co',
      'test-key',
      timeWindow
    );

    result.insights.forEach((insight) => {
      expect(insight).toHaveProperty('type');
      expect(insight).toHaveProperty('title');
      expect(insight).toHaveProperty('summary');
      expect(insight).toHaveProperty('severity');
      expect(insight).toHaveProperty('confidence');
      expect(insight).toHaveProperty('timeWindow');
      expect(insight).toHaveProperty('evidence');
      expect(insight).toHaveProperty('relatedEntities');

      expect(['cost', 'support', 'usage', 'stability']).toContain(insight.type);
      expect(['info', 'warn', 'critical']).toContain(insight.severity);
      expect(insight.confidence).toBeGreaterThanOrEqual(0);
      expect(insight.confidence).toBeLessThanOrEqual(1);
    });
  });
});
