/**
 * Security Headers Middleware
 *
 * Comprehensive security headers for all API responses
 * Helps prevent XSS, clickjacking, MIME sniffing, and other attacks
 */

import { Request, Response, NextFunction } from "express";

interface SecurityHeadersOptions {
  hsts?: boolean;
  frameguard?: "DENY" | "SAMEORIGIN";
  contentSecurityPolicy?: boolean;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

const DEFAULT_OPTIONS: SecurityHeadersOptions = {
  hsts: true,
  frameguard: "DENY",
  contentSecurityPolicy: true,
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
};

export function securityHeaders(options: SecurityHeadersOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    // HSTS - Force HTTPS (only in production)
    if (opts.hsts && process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }

    // X-Frame-Options - Prevent clickjacking
    res.setHeader("X-Frame-Options", opts.frameguard || "DENY");

    // X-Content-Type-Options - Prevent MIME sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // X-XSS-Protection — disabled per OWASP recommendation
    // The legacy XSS Auditor can introduce vulnerabilities in older browsers
    res.setHeader("X-XSS-Protection", "0");

    // Referrer Policy
    res.setHeader("Referrer-Policy", opts.referrerPolicy || "strict-origin-when-cross-origin");

    // Permissions Policy
    res.setHeader(
      "Permissions-Policy",
      opts.permissionsPolicy || "geolocation=(), microphone=(), camera=(), payment=(), usb=()"
    );

    // Content Security Policy
    if (opts.contentSecurityPolicy) {
      const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "frame-ancestors 'none'",
      ].join("; ");

      res.setHeader("Content-Security-Policy", csp);
    }

    // Cache control for sensitive responses
    const isAuthRoute = req.path.includes("/auth/") || req.path.includes("/login");
    if (isAuthRoute) {
      res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");
      res.setHeader("Pragma", "no-cache");
    }

    // Remove server identification
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");

    next();
  };
}
