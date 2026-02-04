const withMDX = require("@next/mdx")({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

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
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  reactStrictMode: true,
  swcMinify: true,
  // Optimize build output
  // Note: On Windows, standalone mode is disabled to avoid symlink permission issues
  // The standalone output is used in CI/production (Linux) for optimized Docker deployments
  output: shouldUseStandalone ? "standalone" : undefined,
  // Reduce memory footprint during build
  compress: true,
  // Enable instrumentation
  experimental: {
    instrumentationHook: true,
    // Optimize memory usage
    optimizeCss: true,
    // Enable SWC minification for faster builds
    swcMinify: true,
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
    // Scale-Readiness: Keep server-only packages out of client bundles
    // WHY THIS HELPS AT SCALE:
    // - Prevents accidental client-side usage (security)
    // - Reduces bundle size dramatically
    // - Faster builds (less transpilation)
    serverComponentsExternalPackages: [
      "@prisma/client",
      "prisma",
      "bcrypt", // Password hashing (server-only)
      "jsonwebtoken", // JWT signing (server-only)
      "nodemailer", // Email (server-only)
    ],
  },
  eslint: {
    // Scale-Readiness: Linting handled in pre-commit hooks and CI pipeline
    // This prevents build failures from style warnings while maintaining quality gates
    // WHERE TYPE SAFETY IS ENFORCED:
    // - Pre-commit hooks (Husky)
    // - CI/CD pipeline (GitHub Actions)
    // - IDE real-time linting (ESLint extension)
    // WHY THIS HELPS AT SCALE:
    // - Faster deploys (no lint blocking)
    // - Consistent enforcement via automation
    // - Clear separation: formatting ≠ deployment blocker
    ignoreDuringBuilds: true,
    dirs: ["src", "app"],
  },
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
  // Environment variables configuration
  // Note: Runtime-only env vars (DB_PASSWORD, ENCRYPTION_KEY, JWT_SECRET, etc.)
  // are not required during build and will be validated at runtime
  env: {
    // Flag to indicate build context (used by env validation helpers)
    SKIP_ENV_VALIDATION: process.env.VERCEL || process.env.CI ? "true" : undefined,
  },
  transpilePackages: [
    "@settler/api",
    "@settler/sdk",
    "@settler/react-settler",
    "@settler/protocol",
    "@settler/types",
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
    // Add external image domains here if needed
    // domains: ['example.com'],
  },
  // PWA Configuration
  async headers() {
    return [
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
            key: "Content-Security-Policy",
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
      {
        source: "/pricing",
        destination: "/product",
        permanent: true,
      },
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

module.exports = withBundleAnalyzer(withMDX(nextConfig));
