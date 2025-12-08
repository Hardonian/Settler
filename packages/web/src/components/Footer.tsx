import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border bg-background" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link 
              href="/" 
              className="flex items-center space-x-2 mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
              aria-label="Settler homepage"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-electric-indigo rounded-lg flex items-center justify-center" aria-hidden="true">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-electric-indigo bg-clip-text text-transparent">
                Settler
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Reconciliation-as-a-Service API. Automate financial data reconciliation across all platforms.
            </p>
          </div>

          {/* Product */}
          <nav aria-label="Product navigation">
            <h3 className="font-semibold text-foreground mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
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
                  href="/cookbooks" 
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Cookbooks
                </Link>
              </li>
              <li>
                <Link 
                  href="/playground" 
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Playground
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
                  href="/enterprise" 
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Enterprise
                </Link>
              </li>
            </ul>
          </nav>

          {/* Resources */}
          <nav aria-label="Resources navigation">
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/support" 
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link 
                  href="/community" 
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Community
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
                  href="/docs" 
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  API Reference
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

          {/* Legal */}
          <nav aria-label="Legal navigation">
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/legal/terms" 
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/privacy" 
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/legal/license" 
                  className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded motion-reduce:transition-none"
                >
                  License
                </Link>
              </li>
            </ul>
          </nav>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2026 Settler. All rights reserved.
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
