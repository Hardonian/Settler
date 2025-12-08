import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import { OrganizationSchema, WebSiteSchema, SoftwareApplicationSchema } from "@/components/StructuredData";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { QueryProvider } from "@/lib/providers/query-provider";

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
  description: "Automate financial data reconciliation across fragmented SaaS and e-commerce ecosystems. One API. All Platforms. Real-Time. 99.7% accuracy, <50ms latency.",
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
    description: "Automate financial data reconciliation across fragmented SaaS and e-commerce ecosystems. One API. All Platforms. Real-Time.",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        </ErrorBoundary>
      </body>
    </html>
  );
}
