import Image from "next/image";
import { StatusIndicator } from "@/components/monitoring/StatusIndicator";
import { UiLink } from "@/components/ui/link";
import { SETTLER_IMAGES } from "@/lib/images/image-config";

const footerSections = [
  {
    heading: "Product",
    links: [
      { href: "/platform", label: "Platform" },
      { href: "/pricing", label: "Pricing" },
      { href: "/docs", label: "Documentation" },
      { href: "/security", label: "Security" },
      { href: "/login", label: "Login" },
      { href: "/signup", label: "Get Started" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "https://github.com/shardie-github/Settler-API", label: "GitHub", external: true },
      { href: "https://status.settler.dev", label: "Status", external: true },
    ],
  },
  {
    heading: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/status", label: "Status" },
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/about", label: "About" },
      { href: "/platform", label: "Platform" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-background px-4 py-12 sm:px-6 lg:px-8" role="contentinfo">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <UiLink href="/" aria-label="Settler homepage" className="mb-4 inline-flex">
              <Image
                src={SETTLER_IMAGES.logoMain.webpPath || SETTLER_IMAGES.logoMain.path}
                alt="Settler Logo"
                width={130}
                height={34}
                className="h-10 w-auto"
                priority
              />
            </UiLink>
            <p className="text-sm text-muted-foreground">
              Open-source reconciliation engine for deterministic, inspectable financial data matching.
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
            <div className="text-sm text-muted-foreground">© 2026 Settler. All rights reserved.</div>
            <StatusIndicator />
          </div>
          <nav className="flex gap-6 text-sm" aria-label="Social media links">
            <UiLink href="https://twitter.com/settler_io" external variant="muted" showExternalIcon={false}>
              Twitter
            </UiLink>
            <UiLink href="https://github.com/shardie-github/Settler-API" external variant="muted" showExternalIcon={false}>
              GitHub
            </UiLink>
            <UiLink href="https://discord.gg/settler" external variant="muted" showExternalIcon={false}>
              Discord
            </UiLink>
          </nav>
        </div>
      </div>
    </footer>
  );
}
