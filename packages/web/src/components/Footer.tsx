import { StatusIndicator } from "@/components/monitoring/StatusIndicator";
import { UiLink } from "@/components/ui/link";
import { SettlerLogo } from "@/components/brand/SettlerLogo";

const footerSections = [
  {
    heading: "Product",
    links: [
      { href: "/platform", label: "Product Surface" },
      { href: "/capabilities", label: "Capabilities" },
      { href: "/product", label: "Product" },
      { href: "/architecture", label: "Architecture" },
      { href: "/pricing", label: "Pricing" },
      { href: "/security-and-audit", label: "Security" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/docs", label: "Documentation" },
      { href: "/docs/quickstart", label: "Quickstart" },
      { href: "/changelog", label: "Changelog" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/open-source", label: "Open Source" },
      { href: "/enterprise", label: "Enterprise" },
      { href: "https://github.com/Hardonian/Settler", label: "GitHub", external: true },
      { href: "/legal/terms", label: "Terms" },
      { href: "/legal/privacy", label: "Privacy" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer
      className="border-t border-border bg-background px-4 py-12 sm:px-6 lg:px-8"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <UiLink href="/" aria-label="Settler homepage" className="mb-4 inline-flex">
              <SettlerLogo variant="horizontal" className="h-10 w-auto" priority />
            </UiLink>
            <p className="text-sm text-muted-foreground">
              Settler is a deterministic reconciliation system with auditable evidence, operational
              diagnostics, and policy-aware controls.
            </p>
          </div>

          {footerSections.map((section) => (
            <nav key={section.heading} aria-label={`${section.heading} navigation`}>
              <h2 className="mb-4 text-sm font-semibold text-foreground">{section.heading}</h2>
              <ul className="space-y-2 text-sm">
                {section.links.map((item) => (
                  <li key={item.href}>
                    {"external" in item && item.external ? (
                      <UiLink href={item.href} external variant="muted" showExternalIcon={false}>
                        {item.label}
                      </UiLink>
                    ) : (
                      <UiLink href={item.href} variant="muted">
                        {item.label}
                      </UiLink>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <div className="text-sm text-muted-foreground">
              © 2026 Settler. All rights reserved.
            </div>
            <StatusIndicator />
          </div>
          <nav className="flex gap-6 text-sm" aria-label="Social media links">
            <UiLink
              href="https://twitter.com/settler_io"
              external
              variant="muted"
              showExternalIcon={false}
            >
              Twitter
            </UiLink>
            <UiLink
              href="https://github.com/Hardonian/Settler"
              external
              variant="muted"
              showExternalIcon={false}
            >
              GitHub
            </UiLink>
            <UiLink
              href="https://discord.gg/settler"
              external
              variant="muted"
              showExternalIcon={false}
            >
              Discord
            </UiLink>
          </nav>
        </div>
      </div>
    </footer>
  );
}
