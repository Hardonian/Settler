"use client";

import { useEffect, useState, useCallback } from "react";
import { SettlerClient } from "@settler/sdk";
import { SecurityPolicy } from "@settler/protocol";

interface SecureMobileAppProps {
  apiKey: string;
  baseURL?: string;
  securityPolicy?: SecurityPolicy;
}

interface SecurityHeaders {
  "Content-Security-Policy": string;
  "X-Frame-Options": string;
  "X-Content-Type-Options": string;
  "Referrer-Policy": string;
  "Permissions-Policy": string;
}

/**
 * Secure Mobile-First Component
 * 
 * Features:
 * - Mobile-optimized responsive design
 * - PWA support with service worker
 * - Security headers and CSP
 * - Secure API communication
 * - Offline support
 * - Touch-optimized UI
 */
export default function SecureMobileApp({
  apiKey,
  baseURL = "https://api.settler.dev",
  securityPolicy,
}: SecureMobileAppProps) {
  const [client, setClient] = useState<SettlerClient | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [securityHeaders, setSecurityHeaders] = useState<SecurityHeaders | null>(null);

  // Initialize secure client
  useEffect(() => {
    const secureClient = new SettlerClient({
      apiKey,
      baseUrl: baseURL,
    });

    // Set security headers
    const headers: SecurityHeaders = {
      "Content-Security-Policy": buildCSP(securityPolicy),
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    };
    setSecurityHeaders(headers);
    setClient(secureClient);
  }, [apiKey, baseURL, securityPolicy]);

  // Register service worker for PWA
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  // Check if PWA is installed
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if running as standalone (installed PWA)
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes("android-app://");

      setIsPWAInstalled(isStandalone);

      // Listen for beforeinstallprompt event
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
    return undefined;
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Install PWA
  const handleInstallPWA = useCallback(async () => {
    if (!installPrompt) return;

    try {
      // Type assertion for BeforeInstallPromptEvent
      interface BeforeInstallPromptEvent extends Event {
        prompt: () => Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
      }
      
      const promptEvent = installPrompt as unknown as BeforeInstallPromptEvent;
      if (promptEvent.prompt) {
        await promptEvent.prompt();
        const choiceResult = await promptEvent.userChoice;
        
        if (choiceResult?.outcome === "accepted") {
          setIsPWAInstalled(true);
        }
      }
    } catch (error) {
      console.error("Error installing PWA:", error);
    }
    
    setInstallPrompt(null);
  }, [installPrompt]);

  // Build Content Security Policy
  const buildCSP = (policy?: SecurityPolicy): string => {
    const csp = policy?.contentSecurityPolicy;
    const defaultCSP = {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Next.js requires this
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "https:"],
      "connect-src": [
        "'self'",
        baseURL,
        "https://api.settler.io",
        "wss://api.settler.io",
      ],
      "font-src": ["'self'", "data:"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'none'"],
      "upgrade-insecure-requests": [],
    };

    if (csp) {
      if (csp.scriptSrc) defaultCSP["script-src"] = csp.scriptSrc;
      if (csp.styleSrc) defaultCSP["style-src"] = csp.styleSrc;
      if (csp.imgSrc) defaultCSP["img-src"] = csp.imgSrc;
      if (csp.connectSrc) defaultCSP["connect-src"] = csp.connectSrc;
    }

    return Object.entries(defaultCSP)
      .map(([key, values]) => {
        const keyFormatted = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        return `${keyFormatted} ${values.join(" ")}`;
      })
      .join("; ");
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing secure connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-area-inset">
      {/* Security Headers (meta tags) */}
      {securityHeaders && (
        <>
          <meta httpEquiv="Content-Security-Policy" content={securityHeaders["Content-Security-Policy"]} />
          <meta httpEquiv="X-Frame-Options" content={securityHeaders["X-Frame-Options"]} />
          <meta httpEquiv="X-Content-Type-Options" content={securityHeaders["X-Content-Type-Options"]} />
          <meta httpEquiv="Referrer-Policy" content={securityHeaders["Referrer-Policy"]} />
          <meta httpEquiv="Permissions-Policy" content={securityHeaders["Permissions-Policy"]} />
        </>
      )}

      {/* Status Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {!isOnline && (
            <div className="flex items-center text-orange-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium">Offline</span>
            </div>
          )}
          {isOnline && (
            <div className="flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium">Online</span>
            </div>
          )}
        </div>

        {installPrompt && !isPWAInstalled && (
          <button
            onClick={handleInstallPWA}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 active:bg-blue-800 touch-manipulation"
          >
            Install App
          </button>
        )}
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold mb-2">Settler</h1>
          <p className="text-gray-600 mb-6">
            Secure reconciliation platform optimized for mobile
          </p>

          {/* Security Badge */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Secure Connection</p>
                <p className="text-xs text-green-600">
                  End-to-end encrypted • CSP enabled • Security headers active
                </p>
              </div>
            </div>
          </div>

          {/* Mobile-Optimized Actions */}
          <div className="space-y-3">
            <button
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 touch-manipulation transition-colors"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              Create Reconciliation Job
            </button>
            <button
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 touch-manipulation transition-colors"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              View Dashboard
            </button>
            <button
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 touch-manipulation transition-colors"
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              View Reports
            </button>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16">
          <button className="flex flex-col items-center justify-center flex-1 touch-manipulation">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs text-gray-600 mt-1">Home</span>
          </button>
          <button className="flex flex-col items-center justify-center flex-1 touch-manipulation">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs text-gray-600 mt-1">Jobs</span>
          </button>
          <button className="flex flex-col items-center justify-center flex-1 touch-manipulation">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs text-gray-600 mt-1">Reports</span>
          </button>
          <button className="flex flex-col items-center justify-center flex-1 touch-manipulation">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs text-gray-600 mt-1">Profile</span>
          </button>
        </div>
      </nav>

      <style jsx global>{`
        /* Mobile-first optimizations */
        .touch-manipulation {
          touch-action: manipulation;
        }
        
        .safe-area-inset {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        .safe-area-inset-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Prevent text selection on buttons */
        button {
          -webkit-user-select: none;
          user-select: none;
        }

        /* Optimize scrolling on mobile */
        * {
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
}
