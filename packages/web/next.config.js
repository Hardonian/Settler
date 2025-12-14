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
    // Exclude server-only packages from client bundles
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
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
  webpack: (config, { isServer }) => {
    // Ensure webpack can resolve path aliases in dynamic imports
    // This is needed for marketing components in subdirectories
    const originalResolve = config.resolve;
    config.resolve = {
      ...originalResolve,
      alias: {
        ...originalResolve.alias,
        '@': require('path').resolve(__dirname, 'src'),
      },
      extensions: [
        ...(originalResolve.extensions || []),
        '.ts',
        '.tsx',
        '.js',
        '.jsx',
      ],
    };
    
    // Exclude Prisma Client from client bundles completely
    // This prevents webpack from trying to bundle server-only code
    if (!isServer) {
      const path = require('path');
      const stubPath = path.resolve(__dirname, 'src/shared/db/prismaClient.stub.ts');
      
      // Primary mechanism: Use alias to replace prismaClient with stub in client bundles
      // This happens during module resolution, before webpack tries to bundle the code
      config.resolve.alias['@/shared/db/prismaClient'] = stubPath;
      
      // Fallback: Use NormalModuleReplacementPlugin to catch any other import patterns
      const NormalModuleReplacementPlugin = require('webpack').NormalModuleReplacementPlugin;
      config.plugins.push(
        new NormalModuleReplacementPlugin(
          /shared[\\/]db[\\/]prismaClient/,
          stubPath
        )
      );
      
      // Also mark Prisma packages as externals to prevent bundling
      config.externals = config.externals || [];
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          ({ request }, callback) => {
            if (request && (request.includes('@prisma/client') || request.includes('prisma'))) {
              return callback(null, 'commonjs ' + request);
            }
            callback();
          },
        ];
      } else if (Array.isArray(config.externals)) {
        config.externals.push({
          '@prisma/client': 'commonjs @prisma/client',
        });
      }
    }
    
    return config;
  },
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
