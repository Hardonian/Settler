// Edge Function: auth_edge_guard
// Purpose: Rate limiting and authentication guard using Upstash Redis
// Authentication: Validates JWT tokens and enforces rate limits per IP and user
// Security: Redis-backed rate limiting with configurable limits

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit using Upstash Redis REST API
 */
async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const restUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const restToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!restUrl || !restToken) {
    // Fallback: allow if Redis is not configured (for development)
    console.warn("Upstash Redis not configured, allowing request");
    return { allowed: true, remaining: limit, reset: Date.now() + windowSeconds * 1000 };
  }

  try {
    // Use Upstash Redis REST API with sliding window rate limiting
    // Key format: rate_limit:{identifier}:{window}
    const windowKey = `${key}:${Math.floor(Date.now() / 1000 / windowSeconds)}`;
    
    // Increment counter and get TTL
    const response = await fetch(`${restUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${restToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", windowKey],
        ["EXPIRE", windowKey, windowSeconds],
        ["GET", windowKey],
      ]),
    });

    if (!response.ok) {
      console.error(`Redis API error: ${response.status}`);
      // Fail open: allow request if Redis is unavailable
      return { allowed: true, remaining: limit, reset: Date.now() + windowSeconds * 1000 };
    }

    const results = await response.json();
    const count = results[2]?.result || 0;
    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);
    const reset = Date.now() + windowSeconds * 1000;

    return { allowed, remaining, reset };
  } catch (error) {
    console.error("Rate limit check failed:", error);
    // Fail open: allow request if Redis check fails
    return { allowed: true, remaining: limit, reset: Date.now() + windowSeconds * 1000 };
  }
}

/**
 * Get cache value from Redis
 */
async function getCache(key: string): Promise<string | null> {
  const restUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const restToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!restUrl || !restToken) {
    return null;
  }

  try {
    const response = await fetch(`${restUrl}/get/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${restToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error("Cache get failed:", error);
    return null;
  }
}

/**
 * Set cache value in Redis
 */
async function setCache(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  const restUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const restToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!restUrl || !restToken) {
    return;
  }

  try {
    await fetch(`${restUrl}/setex/${encodeURIComponent(key)}/${ttlSeconds}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${restToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(value),
    });
  } catch (error) {
    console.error("Cache set failed:", error);
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get IP address for rate limiting
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Get rate limit configuration from environment
    const ipRpm = parseInt(Deno.env.get("IP_RPM") || "300", 10);
    const userRpm = parseInt(Deno.env.get("USER_RPM") || "900", 10);
    const cacheMaxAge = parseInt(Deno.env.get("CACHE_MAX_AGE") || "90", 10);

    // Check IP-based rate limit (per minute)
    const ipLimit = await checkRateLimit(`ip:${ip}`, ipRpm, 60);
    if (!ipLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `Too many requests from this IP. Limit: ${ipRpm} requests per minute.`,
          retryAfter: Math.ceil((ipLimit.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Limit": ipRpm.toString(),
            "X-RateLimit-Remaining": ipLimit.remaining.toString(),
            "X-RateLimit-Reset": new Date(ipLimit.reset).toISOString(),
            "Retry-After": Math.ceil((ipLimit.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          error: "Missing authorization header",
          message: "Authentication required",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check cache for user authentication (to reduce Supabase calls)
    const cacheKey = `auth:${authHeader.substring(0, 50)}`;
    const cachedAuth = await getCache(cacheKey);
    
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (cachedAuth) {
      // Use cached authentication result
      const cached = JSON.parse(cachedAuth);
      userId = cached.userId;
      userEmail = cached.userEmail;
    } else {
      // Validate JWT token with Supabase
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );

      const {
        data: { user },
        error: userError,
      } = await supabaseClient.auth.getUser();

      if (userError || !user) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
            message: "Invalid or expired authentication token",
            details: userError?.message,
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      userId = user.id;
      userEmail = user.email || null;

      // Cache authentication result
      await setCache(
        cacheKey,
        JSON.stringify({ userId, userEmail }),
        cacheMaxAge
      );
    }

    // Check user-based rate limit (per minute)
    if (userId) {
      const userLimit = await checkRateLimit(`user:${userId}`, userRpm, 60);
      if (!userLimit.allowed) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            message: `Too many requests. Limit: ${userRpm} requests per minute.`,
            retryAfter: Math.ceil((userLimit.reset - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "X-RateLimit-Limit": userRpm.toString(),
              "X-RateLimit-Remaining": userLimit.remaining.toString(),
              "X-RateLimit-Reset": new Date(userLimit.reset).toISOString(),
              "Retry-After": Math.ceil((userLimit.reset - Date.now()) / 1000).toString(),
            },
          }
        );
      }
    }

    // Authentication and rate limiting passed
    // Return success response with user info
    return new Response(
      JSON.stringify({
        success: true,
        authenticated: true,
        user: {
          id: userId,
          email: userEmail,
        },
        rateLimit: {
          ip: {
            limit: ipRpm,
            remaining: ipLimit.remaining,
            reset: new Date(ipLimit.reset).toISOString(),
          },
          user: userId
            ? {
                limit: userRpm,
                remaining: userLimit.remaining,
                reset: new Date(userLimit.reset).toISOString(),
              }
            : null,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Limit-IP": ipRpm.toString(),
          "X-RateLimit-Remaining-IP": ipLimit.remaining.toString(),
          "X-RateLimit-Reset-IP": new Date(ipLimit.reset).toISOString(),
          ...(userId
            ? {
                "X-RateLimit-Limit-User": userRpm.toString(),
                "X-RateLimit-Remaining-User": userLimit.remaining.toString(),
                "X-RateLimit-Reset-User": new Date(userLimit.reset).toISOString(),
              }
            : {}),
        },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
