const withMDX = require("@next/mdx")({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  reactStrictMode: true,
  swcMinify: true,
  // Optimize build output
  output: 'standalone',
  // Reduce memory footprint during build
  compress: true,
  // Enable instrumentation
  experimental: {
    instrumentationHook: true,
    // Optimize memory usage
    optimizeCss: true,
    // Enable SWC minification for faster builds
    swcMinify: true,
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-progress', '@radix-ui/react-radio-group'],
  },
  eslint: {
    // Ignore linting during builds - we run linting in pre-commit hooks and CI
    // This prevents build failures from warnings while maintaining code quality checks
    ignoreDuringBuilds: true,
    // Only lint src and app directories
    dirs: ['src', 'app'],
  },
  typescript: {
    // Strict type checking - fail build on errors
    ignoreBuildErrors: false,
    // Show type errors during build
    tsconfigPath: './tsconfig.json',
  },
  // Build optimization
  webpack: (config, { isServer, dev }) => {
    // Optimize bundle size for production client builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    // Ensure server-only code is not bundled in client
    // The 'server-only' package already handles this, but we add extra safety
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Prevent accidental imports of server-only modules in client
        '@/shared/db/prismaClient.server': false,
      };
    }

    return config;
  },
  // Environment variables configuration
  // Note: Runtime-only env vars (DB_PASSWORD, ENCRYPTION_KEY, JWT_SECRET, etc.)
  // are not required during build and will be validated at runtime
  env: {
    // Flag to indicate build context (used by env validation helpers)
    SKIP_ENV_VALIDATION: process.env.VERCEL ? 'true' : undefined,
  },
  transpilePackages: [
    '@settler/api',
    '@settler/sdk',
    '@settler/react-settler',
    '@settler/protocol',
    '@settler/types',
  ],
  // Image Optimization
  images: {
    formats: ['image/webp', 'image/avif'],
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
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel-insights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://*.vercel-insights.com wss://*.supabase.co",
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
};

module.exports = withBundleAnalyzer(withMDX(nextConfig));
