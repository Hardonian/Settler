import Link, { type LinkProps } from "next/link";
import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { ExternalLink } from "lucide-react";

type LinkVariant = "default" | "muted" | "nav";

const variantClasses: Record<LinkVariant, string> = {
  default:
    "inline-flex items-center gap-1 text-foreground/90 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
  muted:
    "inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
  nav: "inline-flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
};

interface BaseProps {
  children: ReactNode;
  className?: string;
  variant?: LinkVariant;
  showExternalIcon?: boolean;
}

type InternalLinkProps = BaseProps &
  Omit<LinkProps, "href"> & { href: LinkProps["href"]; external?: false };

type ExternalLinkProps = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "children" | "className"> & {
    href: string;
    external: true;
  };

type UiLinkProps = InternalLinkProps | ExternalLinkProps;

export function UiLink({
  variant = "default",
  className,
  showExternalIcon,
  ...props
}: UiLinkProps) {
  const classes = cn(variantClasses[variant], className);

  if ("external" in props && props.external) {
    const { children, href, external, ...rest } = props;
    void external;
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
        {showExternalIcon ? <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      </a>
    );
  }

  const { children, href, ...rest } = props;
  return (
    <Link href={href} className={classes} {...rest}>
      {children}
      {showExternalIcon ? <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> : null}
    </Link>
  );
}
