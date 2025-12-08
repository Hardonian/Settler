/**
 * Unit Tests: Error Standardization
 */

import { standardizeError, ErrorCode, handleStandardizedError } from '../../utils/error-standardization';
import { createMockResponse } from './test-helpers';

describe('Error Standardization', () => {
  describe('standardizeError', () => {
    it('should handle duplicate key errors', () => {
      const error = new Error('duplicate key value violates unique constraint');
      const result = standardizeError(error);

      expect(result.code).toBe(ErrorCode.CONFLICT);
      expect(result.statusCode).toBe(409);
    });

    it('should handle foreign key errors', () => {
      const error = new Error('violates foreign key constraint');
      const result = standardizeError(error);

      expect(result.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(result.statusCode).toBe(400);
    });

    it('should handle not found errors', () => {
      const error = new Error('Resource not found');
      const result = standardizeError(error);

      expect(result.code).toBe(ErrorCode.NOT_FOUND);
      expect(result.statusCode).toBe(404);
    });

    it('should handle unknown errors as internal error', () => {
      const error = new Error('Unknown error');
      const result = standardizeError(error);

      expect(result.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(result.statusCode).toBe(500);
    });
  });

  describe('handleStandardizedError', () => {
    it('should send standardized error response', () => {
      const res = createMockResponse() as any;
      const error = new Error('Test error');
      
      handleStandardizedError(res, error, 'test-trace-id');

      expect(res.status).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          message: expect.any(String),
          traceId: 'test-trace-id',
        })
      );
    });
  });
});
