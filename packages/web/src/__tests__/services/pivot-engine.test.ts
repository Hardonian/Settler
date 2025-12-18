/**
 * Pivot Engine Tests
 */

import { describe, it, expect } from 'vitest';
import { validatePivotQuery, PivotQuery } from '@/lib/services/pivot-engine';

describe('Pivot Engine', () => {
  describe('validatePivotQuery', () => {
    it('should validate a correct query', () => {
      const query: PivotQuery = {
        dataset: 'usage',
        rows: ['date'],
        columns: ['org'],
        measure: 'requests',
        aggregation: 'sum',
        filters: {},
      };

      const result = validatePivotQuery(query);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid dataset', () => {
      const query: PivotQuery = {
        dataset: 'invalid' as any,
        rows: ['date'],
        columns: ['org'],
        measure: 'requests',
        aggregation: 'sum',
        filters: {},
      };

      const result = validatePivotQuery(query);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown dataset');
    });

    it('should reject too many row dimensions', () => {
      const query: PivotQuery = {
        dataset: 'usage',
        rows: ['date', 'org', 'route'], // 3 dimensions
        columns: ['org'],
        measure: 'requests',
        aggregation: 'sum',
        filters: {},
      };

      const result = validatePivotQuery(query);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Maximum 2 row dimensions');
    });

    it('should reject too many column dimensions', () => {
      const query: PivotQuery = {
        dataset: 'usage',
        rows: ['date'],
        columns: ['org', 'route', 'user'], // 3 dimensions
        measure: 'requests',
        aggregation: 'sum',
        filters: {},
      };

      const result = validatePivotQuery(query);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Maximum 2 column dimensions');
    });

    it('should reject invalid dimension', () => {
      const query: PivotQuery = {
        dataset: 'usage',
        rows: ['invalid_dimension'],
        columns: ['org'],
        measure: 'requests',
        aggregation: 'sum',
        filters: {},
      };

      const result = validatePivotQuery(query);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid dimension');
    });

    it('should reject invalid measure', () => {
      const query: PivotQuery = {
        dataset: 'usage',
        rows: ['date'],
        columns: ['org'],
        measure: 'invalid_measure',
        aggregation: 'sum',
        filters: {},
      };

      const result = validatePivotQuery(query);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid measure');
    });

    it('should reject invalid aggregation', () => {
      const query: PivotQuery = {
        dataset: 'usage',
        rows: ['date'],
        columns: ['org'],
        measure: 'requests',
        aggregation: 'invalid' as any,
        filters: {},
      };

      const result = validatePivotQuery(query);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid aggregation');
    });
  });
});
