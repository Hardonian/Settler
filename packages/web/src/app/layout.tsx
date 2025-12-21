import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { OrganizationSchema, WebSiteSchema, SoftwareApplicationSchema } from "@/components/StructuredData";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { QueryProvider } from "@/lib/providers/query-provider";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { TenantThemeProvider } from "@/components/tenant/TenantThemeProvider";
import { getTenantContext } from "@/lib/tenant/server";
import { requireEnvironment } from "@/lib/env/validation";
import { ToastContainer } from "@/components/ux/ToastContainer";
import { initSentry } from "@/lib/monitoring/sentry";
import { getImageUrl, SETTLER_IMAGES } from "@/lib/images/image-config";
import { FloatingHelpButton } from "@/components/support/FloatingHelpButton";
import { Chatbot } from "@/components/chatbot/Chatbot";
import { CookieConsent } from "@/components/consent/CookieConsent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://settler.dev'),
  title: {
    default: "Settler - Financial Infrastructure for Developers",
    template: "%s | Settler",
  },
  description: "The API Infrastructure for Financial Evidence, Deterministic Computation, and Developer Flags. Reconcile anything, parse receipts to JSON, and manage entitlements with one typed SDK.",
  keywords: [
    "reconciliation API",
    "financial reconciliation",
    "receipt parsing",
    "feature flags",
    "deterministic math",
    "financial infrastructure",
    "fintech API",
    "API integration",
    "financial automation",
  ],
  authors: [{ name: "Settler" }],
  creator: "Settler",
  publisher: "Settler",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Settler",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: SETTLER_IMAGES.favicon.path, type: SETTLER_IMAGES.favicon.mimeType, sizes: `${SETTLER_IMAGES.favicon.width}x${SETTLER_IMAGES.favicon.height}` },
      { url: SETTLER_IMAGES.favicon192.path, type: SETTLER_IMAGES.favicon192.mimeType, sizes: "192x192" },
      { url: SETTLER_IMAGES.favicon512.path, type: SETTLER_IMAGES.favicon512.mimeType, sizes: "512x512" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: SETTLER_IMAGES.favicon192.path, type: SETTLER_IMAGES.favicon192.mimeType, sizes: "192x192" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://settler.dev",
    siteName: "Settler",
    title: "Settler - Financial Infrastructure for Developers",
    description: "The API Infrastructure for Financial Evidence, Deterministic Computation, and Developer Flags.",
    images: [
      {
        url: getImageUrl('ogImage'),
        width: SETTLER_IMAGES.ogImage.width,
        height: SETTLER_IMAGES.ogImage.height,
        alt: SETTLER_IMAGES.ogImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Settler - Financial Infrastructure for Developers",
    description: "The API Infrastructure for Financial Evidence, Deterministic Computation, and Developer Flags.",
    images: [getImageUrl('twitterCard')],
    creator: "@settler_io",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add when you have verification codes
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#2563eb",
  viewportFit: "cover",
};

// Force dynamic rendering since getTenantContext uses headers()
// This ensures tenant context is resolved at request time
export const dynamic = 'force-dynamic';
// Revalidate every 60 seconds to balance freshness with performance
export const revalidate = 60;

// Validate environment on server startup (non-blocking)
// CRITICAL: Never throw here - allow graceful degradation
if (typeof window === 'undefined') {
  try {
    requireEnvironment();
  } catch (error) {
    // Log but never throw - allow app to render even with missing env vars
    console.warn('Environment validation warning (non-fatal):', 
      error instanceof Error ? error.message : 'Unknown error'
    );
    // Continue execution - pages will handle missing env vars gracefully
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize Sentry (non-blocking, graceful failure)
  if (typeof window === 'undefined') {
    initSentry().catch(() => {
      // Sentry initialization failed (package not available or not configured)
      // This is expected during builds without Sentry configured
    });
  }
  
  // Get tenant context for theme - gracefully handles build-time and errors
  // CRITICAL: Never throw - always return valid context
  let tenantContext;
  try {
    tenantContext = await getTenantContext();
  } catch (error) {
    // Fallback to default context if tenant resolution fails
    // This ensures the app still renders even if tenant service is unavailable
    tenantContext = {
      tenantId: '',
      tenantSlug: 'default',
      theme: null,
      branding: null,
      navigation: null,
    };
    
    // Only log errors in development to avoid build noise
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to get tenant context, using defaults:', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
  
  // Ensure tenantContext is never null/undefined
  if (!tenantContext) {
    tenantContext = {
      tenantId: '',
      tenantSlug: 'default',
      theme: null,
      branding: null,
      navigation: null,
    };
  }
  
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Settler" />
        <OrganizationSchema />
        <WebSiteSchema />
        <SoftwareApplicationSchema />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ErrorBoundary componentName="RootLayout">
          <TenantThemeProvider
            theme={tenantContext.theme}
            tenantId={tenantContext.tenantId || null}
            tenantSlug={tenantContext.tenantSlug || null}
          >
            <QueryProvider>
              {/* Skip to main content link for accessibility */}
              <a
                href="#main-content"
                className="skip-to-main"
              >
                Skip to main content
              </a>
              <SmoothScroll>{children}</SmoothScroll>
              <PwaInstallPrompt />
              <ToastContainer />
              <FloatingHelpButton />
              <Chatbot />
              <CookieConsent />
              <Analytics />
              <SpeedInsights />
            </QueryProvider>
          </TenantThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
