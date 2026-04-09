/**
 * Redis Configuration (Upstash)
 */

export const redisConfig = {
  // Upstash Redis (serverless-friendly)
  upstash: {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.REDIS_TOKEN,
  },

  // Fallback Redis (ioredis for local development)
  fallback: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || "0"),
  },

  // Cache configuration
  cache: {
    defaultTTL: parseInt(process.env.REDIS_CACHE_TTL || "3600"), // 1 hour
    reconciliationTTL: parseInt(process.env.REDIS_RECONCILIATION_TTL || "300"), // 5 minutes
  },
};
