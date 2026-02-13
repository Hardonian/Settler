import Link from "next/link";
import Image from "next/image";
import { StatusIndicator } from "@/components/monitoring/StatusIndicator";
import { SETTLER_IMAGES } from "@/lib/images/image-config";

export function Footer() {
  return (
    <footer
      className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-background"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="flex items-center space-x-2 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              aria-label="Settler homepage"
            >
              <Image
                src={SETTLER_IMAGES.logoMain.webpPath || SETTLER_IMAGES.logoMain.path}
                alt="Settler Logo"
                width={130}
                height={34}
                className="h-10 w-auto"
                priority
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              Open-source reconciliation engine for deterministic, inspectable financial data
              matching.
            </p>
          </div>

          {/* Product */}
          <nav aria-label="Product navigation">
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/platform"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Platform
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/security"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Security
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Get Started
                </Link>
              </li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Resources navigation">
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/shardie-github/Settler-API"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                  aria-label="GitHub repository (opens in new tab)"
                >
                  GitHub
                </a>
              </li>
              <li>
                <Link
                  href="/docs/quickstart"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Quickstart
                </Link>
              </li>
              <li>
                <a
                  href="https://status.settler.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                  aria-label="Status page (opens in new tab)"
                >
                  Status
                </a>
              </li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Legal navigation">
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/docs"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Docs
                </Link>
              </li>
              <li>
                <Link
                  href="/status"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Status
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Terms
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/platform"
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Platform
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="text-sm text-muted-foreground">
              © 2026 Settler. All rights reserved.
            </div>
            <StatusIndicator />
          </div>
          <nav className="flex space-x-6 text-sm" aria-label="Social media links">
            <a
              href="https://twitter.com/settler_io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
              aria-label="Twitter (opens in new tab)"
            >
              Twitter
            </a>
            <a
              href="https://github.com/shardie-github/Settler-API"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
              aria-label="GitHub (opens in new tab)"
            >
              GitHub
            </a>
            <a
              href="https://discord.gg/settler"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
              aria-label="Discord (opens in new tab)"
            >
              Discord
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
