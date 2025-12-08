/**
 * Custom Analytics Provider
 * 
 * Allows sending events to a custom endpoint
 */

import type { AnalyticsProvider } from '../types';

interface CustomProviderConfig {
  endpoint: string;
  headers?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number;
}

class CustomProvider implements AnalyticsProvider {
  private config: CustomProviderConfig;
  private eventQueue: Array<{ type: string; data: any }> = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: CustomProviderConfig) {
    this.config = {
      batchSize: 10,
      flushInterval: 5000,
      ...config,
    };

    if (typeof window !== 'undefined') {
      this.startFlushTimer();
    }
  }

  private startFlushTimer() {
    if (this.config.flushInterval) {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);
    }
  }

  private async sendEvent(type: string, data: any) {
    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        console.warn(`Analytics event failed: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Failed to send analytics event:', error);
    }
  }

  trackPageView(route: string, properties?: Record<string, any>) {
    this.eventQueue.push({
      type: 'page_view',
      data: { route, ...properties },
    });

    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      this.flush();
    }
  }

  trackEvent(name: string, payload?: Record<string, any>) {
    this.eventQueue.push({
      type: 'event',
      data: { name, ...payload },
    });

    if (this.eventQueue.length >= (this.config.batchSize || 10)) {
      this.flush();
    }
  }

  trackError(error: Error | string, metadata?: Record<string, any>) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;

    this.eventQueue.push({
      type: 'error',
      data: {
        message: errorMessage,
        stack: errorStack,
        ...metadata,
      },
    });

    // Errors are sent immediately
    this.flush();
  }

  identify(userId: string, traits?: Record<string, any>) {
    this.eventQueue.push({
      type: 'identify',
      data: { userId, traits },
    });
  }

  setUserProperties(properties: Record<string, any>) {
    this.eventQueue.push({
      type: 'user_properties',
      data: properties,
    });
  }

  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Send events in batch
    await Promise.all(
      events.map((event) => this.sendEvent(event.type, event.data))
    );
  }

  init() {
    // Custom provider doesn't need initialization
  }
}

export const createCustomProvider = (config: CustomProviderConfig): CustomProvider => {
  return new CustomProvider(config);
};
