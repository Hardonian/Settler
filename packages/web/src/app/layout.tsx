import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { OrganizationSchema, WebSiteSchema, SoftwareApplicationSchema } from "@/components/StructuredData";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { QueryProvider } from "@/lib/providers/query-provider";
import { TenantThemeProvider } from "@/components/tenant/TenantThemeProvider";
import { getTenantContext } from "@/lib/tenant/server";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://settler.dev'),
  title: {
    default: "Settler - Reconciliation as a Service API",
    template: "%s | Settler",
  },
  description: "Automate financial data reconciliation across fragmented SaaS and e-commerce ecosystems. Connect Shopify, Stripe, PayPal, and 50+ platforms. 99.7% accuracy, <50ms latency, SOC 2 Type II certified. Start free trial, no credit card required.",
  keywords: [
    "reconciliation API",
    "financial reconciliation",
    "data reconciliation",
    "SaaS reconciliation",
    "e-commerce reconciliation",
    "Stripe reconciliation",
    "Shopify reconciliation",
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
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://settler.dev",
    siteName: "Settler",
    title: "Settler - Reconciliation as a Service API",
    description: "Automate financial data reconciliation across fragmented SaaS and e-commerce ecosystems. Connect Shopify, Stripe, PayPal, and 50+ platforms. 99.7% accuracy, <50ms latency, SOC 2 Type II certified.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Settler - Reconciliation as a Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Settler - Reconciliation as a Service API",
    description: "Automate financial data reconciliation across fragmented SaaS and e-commerce ecosystems.",
    images: ["/og-image.png"],
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get tenant context for theme - gracefully handles build-time and errors
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
      console.warn('Failed to get tenant context, using defaults:', error);
    }
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
              <Analytics />
              <SpeedInsights />
            </QueryProvider>
          </TenantThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
