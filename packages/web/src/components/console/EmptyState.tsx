/**
 * Empty State Component
 * 
 * Consistent empty state UI across console pages.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BrandMessages } from '@/lib/brand/messaging';

interface EmptyStateProps {
  type: 'apiKeys' | 'receipts' | 'featureFlags' | 'webhooks' | 'insights' | 'alerts' | 'usage';
  title?: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  icon?: React.ReactNode;
}

export function EmptyState({ type, title, description, action, icon }: EmptyStateProps) {
  const defaultMessages = BrandMessages.empty;
  const defaultTitle = title || `No ${type} yet`;
  const defaultDescription = description || defaultMessages[type] || 'Get started by creating your first item.';

  return (
    <Card>
      <CardContent className="py-12 text-center">
        {icon && <div className="mb-4 flex justify-center">{icon}</div>}
        <h3 className="text-lg font-semibold mb-2">{defaultTitle}</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto">
          {defaultDescription}
        </p>
        {action && (
          <Button asChild>
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
