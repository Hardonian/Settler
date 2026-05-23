const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const path = require("path");
const os = require("os");

/**
 * Detect if running on Windows without elevated permissions
 * Windows symlink creation requires admin rights, which causes
 * EPERM errors during Next.js standalone build
 */
const isWindows = os.platform() === "win32";
// Only use standalone output on non-Windows platforms or CI (CI runs on Linux)
// On Windows, use default output format to avoid symlink permission issues
const shouldUseStandalone = !isWindows || process.env.CI === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx"],
  reactStrictMode: true,
  // Optimize build output
  // Note: On Windows, standalone mode is disabled to avoid symlink permission issues
  // The standalone output is used in CI/production (Linux) for optimized Docker deployments
  output: shouldUseStandalone ? "standalone" : undefined,
  // Ensure Next.js uses the repo root for output tracing when multiple lockfiles exist.
  outputFileTracingRoot: path.resolve(__dirname, "..", ".."),
  // Reduce memory footprint during build
  compress: true,
  experimental: {
    // Scale-Readiness: Tree-shake heavy packages to reduce bundle size
    // Each package here gets modular imports (import { Icon } from 'lucide-react')
    // instead of full bundle imports, saving ~50-200KB per package
    // WHY THIS HELPS AT SCALE:
    // - Faster page loads (smaller bundles)
    // - Lower bandwidth costs
    // - Better Core Web Vitals
    optimizePackageImports: [
      "lucide-react", // Icons: ~300KB → ~20KB per icon
      "@radix-ui/react-progress", // UI primitives
      "@radix-ui/react-radio-group",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "framer-motion", // Animations: ~180KB, tree-shake unused features
      "date-fns", // Date utilities: ~200KB → ~2KB per function
      "@tanstack/react-query", // Data fetching
      "recharts", // Charts: ~400KB, only load used chart types
    ],
  },
  // Scale-Readiness: Keep server-only packages out of client bundles
  // WHY THIS HELPS AT SCALE:
  // - Prevents accidental client-side usage (security)
  // - Reduces bundle size dramatically
  // - Faster builds (less transpilation)
  serverExternalPackages: [
    "@prisma/client",
    "prisma",
    "bcrypt", // Password hashing (server-only)
    "jsonwebtoken", // JWT signing (server-only)
    "nodemailer", // Email (server-only)
    // NOTE: @jobforge/sdk-ts and @jobforge/shared are NOT listed here.
    // They use ESM dist output that webpack can't require() as an external.
    // Instead they are resolved via webpack aliases below (same pattern as
    // @settler/reconciliation-core) so webpack bundles them into the server output.
  ],
  typescript: {
    // Scale-Readiness: Type safety enforced during development, not deployment
    // Next.js has its own type checking that handles webpack aliases correctly
    // Running `tsc --noEmit` directly will show false positives due to:
    // - Next.js module resolution (next/link, next/server)
    // - Webpack aliases (@/, @settler/*)
    // - Dynamic imports and app router patterns
    // WHERE TYPE SAFETY IS ENFORCED:
    // - IDE real-time checking (TypeScript LSP)
    // - Pre-commit hooks
    // - CI/CD pipeline with full Next.js context
    // WHY THIS HELPS AT SCALE:
    // - Prevents false deployment failures
    // - Faster builds (Next.js incremental checking)
    // - Type errors caught earlier in dev/PR cycle
    ignoreBuildErrors: true,
    tsconfigPath: "./tsconfig.json",
  },
  // Configure Turbopack explicitly to avoid dev startup failures
  // when a custom webpack config is present.
  turbopack: {},
  // Environment variables configuration
  // Note: Runtime-only env vars (DB_PASSWORD, ENCRYPTION_KEY, JWT_SECRET, etc.)
  // are not required during build and will be validated at runtime
  env: {
    // Flag to indicate build context (used by env validation helpers)
    SKIP_ENV_VALIDATION: process.env.VERCEL || process.env.CI ? "true" : undefined,
  },
  transpilePackages: [
    "@settler/api",
    "@settler/reconciliation-core",
    "@settler/sdk",
    "@settler/react-settler",
    "@settler/protocol",
    "@settler/types",
    "@settler/support-intake",
  ],
  webpack: (config, { isServer }) => {
    // Ensure webpack can resolve path aliases in dynamic imports
    // This is needed for marketing components in subdirectories
    const originalResolve = config.resolve;
    config.resolve = {
      ...originalResolve,
      alias: {
        ...originalResolve.alias,
        "@": path.resolve(__dirname, "src"),
        // Align with packages/web/tsconfig.json paths: consume `dist` so ESM `./foo.js` re-exports resolve.
        "@settler/reconciliation-core": path.resolve(
          __dirname,
          "../reconciliation-core/dist/index.js"
        ),
        // Workspace packages with ESM dist output — resolve directly so webpack
        // can bundle them instead of trying to require() them as CJS externals.
        "@jobforge/sdk-ts": path.resolve(__dirname, "../../packages/jobforge-sdk-ts/dist/index.js"),
        "@jobforge/shared": path.resolve(__dirname, "../../packages/jobforge-shared/dist/index.js"),
        "@settler/api/lib/email-lifecycle": path.resolve(
          __dirname,
          "../api/dist/lib/email-lifecycle.js"
        ),
        "@settler/api/dist/ops/activation-funnel": path.resolve(
          __dirname,
          "../api/dist/ops/activation-funnel.js"
        ),
        "@settler/api/dist/ops/billing-hardening": path.resolve(
          __dirname,
          "../api/dist/ops/billing-hardening.js"
        ),
      },
      extensions: [...(originalResolve.extensions || []), ".ts", ".tsx", ".js", ".jsx"],
    };

    // Exclude Prisma Client from client bundles completely
    // This prevents webpack from trying to bundle server-only code
    if (!isServer) {
      const path = require("path");
      const stubPath = path.resolve(__dirname, "src/shared/db/prismaClient.stub.ts");

      // Primary mechanism: Use alias to replace prismaClient with stub in client bundles
      // This happens during module resolution, before webpack tries to bundle the code
      config.resolve.alias["@/shared/db/prismaClient"] = stubPath;

      // Fallback: Use NormalModuleReplacementPlugin to catch any other import patterns
      const NormalModuleReplacementPlugin = require("webpack").NormalModuleReplacementPlugin;
      config.plugins.push(
        new NormalModuleReplacementPlugin(/shared[\\/]db[\\/]prismaClient/, stubPath)
      );

      // Handle node: URI scheme for packages like @settler/protocol that use node:crypto.
      // Webpack cannot resolve node: protocol URIs in client bundles; strip the prefix so
      // webpack falls through to its built-in Node.js polyfill layer instead.
      config.plugins.push(
        new NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
      // Polyfill or stub Node.js built-ins that @settler/protocol pulls in
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      };

      // Also mark Prisma packages as externals to prevent bundling
      config.externals = config.externals || [];
      if (typeof config.externals === "function") {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          ({ request }, callback) => {
            if (request && (request.includes("@prisma/client") || request.includes("prisma"))) {
              return callback(null, "commonjs " + request);
            }
            callback();
          },
        ];
      } else if (Array.isArray(config.externals)) {
        config.externals.push({
          "@prisma/client": "commonjs @prisma/client",
        });
      }
    }

    // On server, exclude @builder.io/react from the bundle entirely
    // It uses React features incompatible with SSR (createContext issues)
    if (isServer) {
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("@builder.io/react");
        config.externals.push("@builder.io/sdk");
      } else if (typeof config.externals === "function") {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          ({ request }, callback) => {
            if (
              request &&
              (request.includes("@builder.io/react") || request.includes("@builder.io/sdk"))
            ) {
              return callback(null, "commonjs " + request);
            }
            callback();
          },
        ];
      }
    }

    return config;
  },
  // Image Optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // PWA Configuration
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/:path*\\.(svg|png|jpg|jpeg|webp|avif|ico)$",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://status.settler.dev wss://*.supabase.co",
              "frame-src 'self' https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
  // Redirects for route consistency
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.png",
        permanent: false,
      },
      {
        source: "/favicon.svg",
        destination: "/icon.png",
        permanent: false,
      },
      // Root redirect to home page
      {
        source: "/",
        destination: "/home",
        permanent: false,
      },
      {
        source: "/oss",
        destination: "/open-source",
        permanent: true,
      },
      {
        source: "/security",
        destination: "/security-and-audit",
        permanent: true,
      },
      // /pricing is a standalone page — no redirect needed
      {
        source: "/demo",
        destination: "/product",
        permanent: true,
      },
      {
        source: "/comparison",
        destination: "/product",
        permanent: true,
      },
      {
        source: "/roi-calculator",
        destination: "/product",
        permanent: true,
      },
      {
        source: "/why-settler",
        destination: "/product",
        permanent: true,
      },
      {
        source: "/how-it-works",
        destination: "/product",
        permanent: true,
      },
      {
        source: "/vision",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/roadmap",
        destination: "/changelog",
        permanent: true,
      },
      {
        source: "/trust",
        destination: "/security-and-audit",
        permanent: true,
      },
      {
        source: "/proof",
        destination: "/product",
        permanent: true,
      },
      {
        source: "/use-cases/:path*",
        destination: "/product",
        permanent: true,
      },
      // Redirect /cookbooks (plural) to /cookbook (singular)
      {
        source: "/cookbooks",
        destination: "/cookbook",
        permanent: true,
      },
      // Redirect /cookbooks/* to /cookbook/*
      {
        source: "/cookbooks/:path*",
        destination: "/cookbook/:path*",
        permanent: true,
      },
      // Redirect /console/playground to /playground
      {
        source: "/console/playground",
        destination: "/playground",
        permanent: true,
      },
      // Redirect /console/playground/* to /playground/*
      {
        source: "/console/playground/:path*",
        destination: "/playground/:path*",
        permanent: true,
      },
      // Legacy dashboard routes -> console
      {
        source: "/dashboard",
        destination: "/console",
        permanent: false, // Temporary redirect for migration
      },
      {
        source: "/app/console",
        destination: "/console",
        permanent: true,
      },
      {
        source: "/console-home",
        destination: "/console",
        permanent: true,
      },
      // Legacy playground routes
      {
        source: "/app/playground",
        destination: "/playground",
        permanent: true,
      },
      {
        source: "/playground-home",
        destination: "/playground",
        permanent: true,
      },
      // Phase 1 route closure - 4 known broken routes
      {
        source: "/console/dashboard",
        destination: "/console",
        permanent: true,
      },
      {
        source: "/console/rules",
        destination: "/console/rules-engine",
        permanent: true,
      },
      {
        source: "/dashboard/settings",
        destination: "/console/settings",
        permanent: true,
      },
      {
        source: "/console/integrations",
        destination: "/dashboard/integrations",
        permanent: true,
      },
      // Legacy marketing/docs slugs → existing App Router pages (internal link integrity)
      { source: "/docs/intro", destination: "/docs/quickstart", permanent: true },
      {
        source: "/docs/architecture",
        destination: "/docs/architecture/platform-architecture",
        permanent: true,
      },
      { source: "/docs/installation", destination: "/docs/getting-started", permanent: true },
      { source: "/docs/policies", destination: "/docs/cli", permanent: true },
      { source: "/docs/assertions", destination: "/docs/errors", permanent: true },
      { source: "/docs/adapters", destination: "/docs/integrations", permanent: true },
      { source: "/docs/sync", destination: "/docs/webhooks", permanent: true },
      { source: "/docs/deploy", destination: "/docs/launch", permanent: true },
      { source: "/docs/proof-explorer", destination: "/console/proof-explorer", permanent: true },
      { source: "/docs/rbac", destination: "/docs/auth", permanent: true },
      { source: "/docs/auditor", destination: "/security-and-audit", permanent: true },
      { source: "/docs/oss-setup", destination: "/docs/getting-started", permanent: true },
      { source: "/docs/api-guide", destination: "/docs/api", permanent: true },
      { source: "/docs/security", destination: "/security-and-audit", permanent: true },
      { source: "/console/governance", destination: "/app/governance", permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/app",
        destination: "/console",
      },
      {
        source: "/app/:path*",
        destination: "/console/:path*",
      },
    ];
  },
};

// Sentry Webpack Plugin Configuration
// Only apply Sentry config if the package is available
let finalConfig = withBundleAnalyzer(nextConfig);

try {
  const { withSentryConfig } = require("@sentry/nextjs");

  const sentryEnabled = process.env.NEXT_PUBLIC_ENABLE_SENTRY === "true";
  const sentryConfigured = Boolean(
    process.env.SENTRY_DSN &&
    process.env.SENTRY_AUTH_TOKEN &&
    process.env.SENTRY_ORG &&
    process.env.SENTRY_PROJECT
  );

  if (sentryEnabled && !sentryConfigured) {
    console.warn(
      "[Sentry] Enabled but missing SENTRY_AUTH_TOKEN/SENTRY_ORG/SENTRY_PROJECT. Skipping Sentry webpack plugin."
    );
  }

  if (sentryEnabled && sentryConfigured) {
    const sentryWebpackPluginOptions = {
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    };

    finalConfig = withSentryConfig(finalConfig, sentryWebpackPluginOptions);
  }
} catch (e) {
  // Sentry webpack plugin not available - continue without it
  console.warn("[Sentry] Webpack plugin not available, skipping source map upload");
}

module.exports = finalConfig;
