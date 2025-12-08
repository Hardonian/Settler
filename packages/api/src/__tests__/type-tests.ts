/**
 * Type Tests
 * Ensures type safety with runtime checks
 */

import { expectTypeOf } from 'vitest';
import { ApiError, ValidationError, NotFoundError } from '../utils/typed-errors';
import { Result, Option, isNotNull, isString, isNumber, isPlainObject } from '../utils/common-types';

describe('Type Tests', () => {
  describe('Typed Errors', () => {
    it('should have correct types', () => {
      const error = new ValidationError('Invalid input', 'email');
      expectTypeOf(error.statusCode).toBeNumber();
      expectTypeOf(error.statusCode).toEqualTypeOf<400>();
      expectTypeOf(error.errorCode).toBeString();
      expectTypeOf(error.message).toBeString();
    });

    it('should allow type narrowing', () => {
      function handleError(error: unknown): string {
        if (error instanceof ApiError) {
          return error.errorCode;
        }
        return 'UNKNOWN';
      }

      const error = new NotFoundError('Not found', 'job', '123');
      expectTypeOf(handleError(error)).toBeString();
    });
  });

  describe('Common Types', () => {
    it('Result type should work correctly', () => {
      const success: Result<string> = { success: true, data: 'test' };
      const failure: Result<string> = { success: false, error: new Error('failed') };

      expectTypeOf(success.success).toBeBoolean();
      if (success.success) {
        expectTypeOf(success.data).toBeString();
      } else {
        expectTypeOf(success.error).toBeInstanceOf(Error);
      }
    });

    it('Type guards should narrow types', () => {
      const value: unknown = 'test';
      if (isString(value)) {
        expectTypeOf(value).toBeString();
      }

      const num: unknown = 123;
      if (isNumber(num)) {
        expectTypeOf(num).toBeNumber();
      }
      const obj: unknown = { key: 'value' };
      if (isPlainObject(obj)) {
        expectTypeOf(obj).toMatchTypeOf<Record<string, unknown>>();
      }
    });
  });
});
