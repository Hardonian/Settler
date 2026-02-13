import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SmoothScroll } from "@/components/ui/SmoothScroll";
import {
  OrganizationSchema,
  WebSiteSchema,
  SoftwareApplicationSchema,
} from "@/components/StructuredData";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { QueryProvider } from "@/lib/providers/query-provider";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { TenantThemeProvider } from "@/components/tenant/TenantThemeProvider";
import { ToastContainer } from "@/components/ux/ToastContainer";
import { initSentry } from "@/lib/monitoring/sentry";
import { getImageUrl, SETTLER_IMAGES } from "@/lib/images/image-config";
import { RuntimeUiConfigProvider } from "@/lib/runtime-ui-config/client";
import { AnnouncementBanner } from "@/components/polish/AnnouncementBanner";
import { RuntimeUiOptionalFeatures } from "@/components/polish/RuntimeUiOptionalFeatures";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://settler.dev"),
  title: {
    default: "Settler - Open-Source Reconciliation Engine",
    template: "%s | Settler",
  },
  description:
    "Settler is an open-source reconciliation engine that normalizes financial data, applies explicit rules, and surfaces variances for human review.",
  keywords: [
    "reconciliation engine",
    "financial reconciliation",
    "deterministic reconciliation",
    "variance detection",
    "open source finance",
    "provider-agnostic reconciliation",
    "rules-based reconciliation",
    "audit evidence",
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
      // WebP version for modern browsers (better performance)
      ...(SETTLER_IMAGES.favicon.webpPath
        ? [
            {
              url: SETTLER_IMAGES.favicon.webpPath,
              type: "image/webp",
              sizes: `${SETTLER_IMAGES.favicon.width}x${SETTLER_IMAGES.favicon.height}`,
            },
          ]
        : []),
      {
        url: SETTLER_IMAGES.favicon.path,
        type: SETTLER_IMAGES.favicon.mimeType,
        sizes: `${SETTLER_IMAGES.favicon.width}x${SETTLER_IMAGES.favicon.height}`,
      },
      ...(SETTLER_IMAGES.favicon192.webpPath
        ? [{ url: SETTLER_IMAGES.favicon192.webpPath, type: "image/webp", sizes: "192x192" }]
        : []),
      {
        url: SETTLER_IMAGES.favicon192.path,
        type: SETTLER_IMAGES.favicon192.mimeType,
        sizes: "192x192",
      },
      ...(SETTLER_IMAGES.favicon512.webpPath
        ? [{ url: SETTLER_IMAGES.favicon512.webpPath, type: "image/webp", sizes: "512x512" }]
        : []),
      {
        url: SETTLER_IMAGES.favicon512.path,
        type: SETTLER_IMAGES.favicon512.mimeType,
        sizes: "512x512",
      },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      {
        url: SETTLER_IMAGES.favicon192.path,
        type: SETTLER_IMAGES.favicon192.mimeType,
        sizes: "192x192",
      },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://settler.dev",
    siteName: "Settler",
    title: "Settler - Open-Source Reconciliation Engine",
    description:
      "Settler is an open-source reconciliation engine that normalizes financial data, applies explicit rules, and surfaces variances for human review.",
    images: [
      {
        url: getImageUrl("ogImage"),
        width: SETTLER_IMAGES.ogImage.width,
        height: SETTLER_IMAGES.ogImage.height,
        alt: SETTLER_IMAGES.ogImage.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Settler - Open-Source Reconciliation Engine",
    description:
      "Settler is an open-source reconciliation engine that normalizes financial data, applies explicit rules, and surfaces variances for human review.",
    images: [getImageUrl("twitterCard")],
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Initialize Sentry (non-blocking, graceful failure)
  if (typeof window === "undefined") {
    initSentry().catch(() => {
      // Sentry initialization failed (package not available or not configured)
      // This is expected during builds without Sentry configured
    });
  }

  return (
    <html lang="en" suppressHydrationWarning>
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
            theme={null}
            tenantId={null}
            tenantSlug={null}
          >
            <RuntimeUiConfigProvider>
              <QueryProvider>
                {/* Skip to main content link for accessibility */}
                <a href="#main-content" className="skip-to-main">
                  Skip to main content
                </a>
                <AnnouncementBanner />
                <SmoothScroll>{children}</SmoothScroll>
                <PwaInstallPrompt />
                <ToastContainer />
                <RuntimeUiOptionalFeatures />
              </QueryProvider>
            </RuntimeUiConfigProvider>
          </TenantThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
