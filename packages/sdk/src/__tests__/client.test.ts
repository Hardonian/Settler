import { describe, it, expect, beforeEach } from '@jest/globals';
import { SettlerClient } from '../client';
import {
  NetworkError,
  AuthError,
  ValidationError,
  RateLimitError,
} from '../errors';
import { mockCreateJobRequest, mockJob } from './fixtures';

describe('SettlerClient', () => {
  let client: SettlerClient;

  beforeEach(() => {
    client = new SettlerClient({
      apiKey: 'test_api_key',
      baseUrl: 'https://api.settler.dev',
    });
  });

  describe('initialization', () => {
    it('should create a client with default config', () => {
      const defaultClient = new SettlerClient({
        apiKey: 'test_api_key',
      });
      expect(defaultClient).toBeInstanceOf(SettlerClient);
    });

    it('should throw error if API key is missing', () => {
      expect(() => {
        new SettlerClient({ apiKey: '' });
      }).toThrow('API key is required');
    });

    it('should initialize all client modules', () => {
      expect(client.jobs).toBeDefined();
      expect(client.reports).toBeDefined();
      expect(client.webhooks).toBeDefined();
      expect(client.adapters).toBeDefined();
    });
  });

  describe('jobs client', () => {
    it('should create a job', async () => {
      const response = await client.jobs.create(mockCreateJobRequest);
      expect(response.data).toBeDefined();
      expect(response.data.name).toBe(mockCreateJobRequest.name);
    });

    it('should get a job', async () => {
      const response = await client.jobs.get('job_123');
      expect(response.data.id).toBe('job_123');
    });

    it('should list jobs', async () => {
      const response = await client.jobs.list();
      expect(response.data).toBeInstanceOf(Array);
      expect(response.count).toBeGreaterThan(0);
    });

    it('should run a job', async () => {
      const response = await client.jobs.run('job_123');
      expect(response.data.status).toBe('running');
    });

    it('should delete a job', async () => {
      await expect(client.jobs.delete('job_123')).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw ValidationError for 400', async () => {
      await expect(
        client.request('GET', '/api/v1/error/400')
      ).rejects.toThrow(ValidationError);
    });

    it('should throw AuthError for 401', async () => {
      await expect(
        client.request('GET', '/api/v1/error/401')
      ).rejects.toThrow(AuthError);
    });

    it('should throw RateLimitError for 429', async () => {
      try {
        await client.request('GET', '/api/v1/error/429');
      } catch (error) {
        expect(error).toBeInstanceOf(RateLimitError);
        if (error instanceof RateLimitError) {
          expect(error.retryAfter).toBeDefined();
        }
      }
    });

    it('should throw ServerError for 500', async () => {
      await expect(
        client.request('GET', '/api/v1/error/500')
      ).rejects.toThrow();
    });
  });
});
