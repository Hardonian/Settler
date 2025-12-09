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
    // Allow builds to complete even with lint warnings
    // Critical errors are disabled in .eslintrc.json
    ignoreDuringBuilds: false,
    // Only lint src and app directories
    dirs: ['src', 'app'],
  },
  typescript: {
    // Strict type checking - fail build on errors
    ignoreBuildErrors: false,
    // Show type errors during build
    tsconfigPath: './tsconfig.json',
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
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(withMDX(nextConfig));
