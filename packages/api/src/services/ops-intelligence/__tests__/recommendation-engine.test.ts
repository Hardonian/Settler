/**
 * Recommendation Engine Tests
 */

import { generateRecommendations } from '../recommendation-engine';
import { Insight } from '../insights-engine';

describe('Recommendation Engine', () => {
  it('should generate recommendations for cost insights', () => {
    const insight: Insight = {
      type: 'cost',
      title: 'Cost increased 50% week-over-week',
      summary: 'Weekly cost spike detected',
      severity: 'critical',
      confidence: 0.85,
      timeWindow: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
      evidence: {
        metrics: {
          wowChangePercent: 50,
        },
      },
      relatedEntities: {},
    };

    const recommendations = generateRecommendations(insight);

    expect(recommendations).toBeInstanceOf(Array);
    expect(recommendations.length).toBeGreaterThan(0);
    recommendations.forEach((rec) => {
      expect(rec).toHaveProperty('actionType');
      expect(rec).toHaveProperty('description');
      expect(rec).toHaveProperty('riskLevel');
      expect(rec).toHaveProperty('expectedImpact');
      expect(rec).toHaveProperty('reversibility');
      expect(['low', 'med', 'high']).toContain(rec.riskLevel);
    });
  });

  it('should generate recommendations for support insights', () => {
    const insight: Insight = {
      type: 'support',
      title: 'Support ticket spike: 20 tickets (+100%)',
      summary: 'Ticket volume increased',
      severity: 'warn',
      confidence: 0.90,
      timeWindow: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
      evidence: {
        metrics: {
          changePercent: 100,
        },
      },
      relatedEntities: {},
    };

    const recommendations = generateRecommendations(insight);

    expect(recommendations).toBeInstanceOf(Array);
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it('should generate recommendations for stability insights', () => {
    const insight: Insight = {
      type: 'stability',
      title: 'Error rate increased 75% week-over-week',
      summary: 'Error spike detected',
      severity: 'critical',
      confidence: 0.95,
      timeWindow: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
      evidence: {
        metrics: {
          errorRateChangePercent: 75,
        },
      },
      relatedEntities: {},
    };

    const recommendations = generateRecommendations(insight);

    expect(recommendations).toBeInstanceOf(Array);
    expect(recommendations.length).toBeGreaterThan(0);
  });

  it('should generate recommendations for usage insights', () => {
    const insight: Insight = {
      type: 'usage',
      title: 'Feature adoption decreased 40%',
      summary: 'Feature usage dropped',
      severity: 'warn',
      confidence: 0.80,
      timeWindow: {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      },
      evidence: {
        metrics: {
          changePercent: -40,
        },
      },
      relatedEntities: {},
    };

    const recommendations = generateRecommendations(insight);

    expect(recommendations).toBeInstanceOf(Array);
    expect(recommendations.length).toBeGreaterThan(0);
  });
});
