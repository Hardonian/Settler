import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ConversionCTAProps {
  title?: string;
  description?: string;
  primaryAction?: string;
  primaryLink?: string;
  secondaryAction?: string;
  secondaryLink?: string;
  variant?: 'default' | 'gradient' | 'minimal';
}

export function ConversionCTA({
  title = 'Ready to Get Started?',
  description = 'Start reconciling your data in minutes. No credit card required.',
  primaryAction = 'Start Free Trial',
  primaryLink = '/playground',
  secondaryAction = 'View Pricing',
  secondaryLink = '/pricing',
  variant = 'gradient',
}: ConversionCTAProps) {
  if (variant === 'minimal') {
    return (
      <div className="text-center py-12" role="region" aria-labelledby="cta-title">
        <h3 id="cta-title" className="text-2xl font-bold mb-4 text-foreground">
          {title}
        </h3>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">{description}</p>
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          role="group"
          aria-label="Call to action buttons"
        >
          <Button
            asChild
            size="lg"
            variant="default"
          >
            <Link href={primaryLink} aria-label={primaryAction}>
              {primaryAction}
            </Link>
          </Button>
          {secondaryAction && (
            <Button
              asChild
              size="lg"
              variant="outline"
            >
              <Link href={secondaryLink} aria-label={secondaryAction}>
                {secondaryAction}
              </Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <Card
        className={cn(
          'bg-gradient-to-r from-primary-600 to-electric-indigo',
          'border-0 shadow-2xl',
          'transition-all duration-500 hover:shadow-3xl'
        )}
        elevation="lg"
        role="region"
        aria-labelledby="cta-title"
      >
        <CardHeader className="text-center">
          <CardTitle id="cta-title" className="text-3xl md:text-4xl text-white mb-4">
            {title}
          </CardTitle>
          <CardDescription className="text-primary-100 text-lg">{description}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            role="group"
            aria-label="Call to action buttons"
          >
            <Button
              size="lg"
              variant="secondary"
              asChild
              className="bg-white text-primary-600 hover:bg-primary-50"
            >
              <Link href={primaryLink} aria-label={primaryAction}>
                {primaryAction}
              </Link>
            </Button>
            {secondaryAction && (
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-white text-white hover:bg-white/10"
              >
                <Link href={secondaryLink} aria-label={secondaryAction}>
                  {secondaryAction}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      elevation="lg"
      hover
      role="region"
      aria-labelledby="cta-title"
    >
      <CardHeader className="text-center">
        <CardTitle id="cta-title" className="text-2xl md:text-3xl mb-2">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          role="group"
          aria-label="Call to action buttons"
        >
          <Button
            size="lg"
            asChild
            variant="default"
          >
            <Link href={primaryLink} aria-label={primaryAction}>
              {primaryAction}
            </Link>
          </Button>
          {secondaryAction && (
            <Button
              size="lg"
              variant="outline"
              asChild
            >
              <Link href={secondaryLink} aria-label={secondaryAction}>
                {secondaryAction}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
