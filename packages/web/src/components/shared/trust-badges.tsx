/**
 * Trust Badges Component
 * 
 * Reusable trust signals for public-facing pages.
 */

'use client';

import { Shield, Lock, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function SecurityBadge() {
  return (
    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300">
      <Shield className="w-3 h-3 mr-1" aria-hidden="true" />
      <span>Secure</span>
    </Badge>
  );
}

export function EncryptionBadge() {
  return (
    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
      <Lock className="w-3 h-3 mr-1" aria-hidden="true" />
      <span>Encrypted</span>
    </Badge>
  );
}

export function SOC2Badge() {
  return (
    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
      <Award className="w-3 h-3 mr-1" aria-hidden="true" />
      <span>SOC 2 Compliant</span>
    </Badge>
  );
}

export function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2" role="list" aria-label="Security and compliance badges">
      <SecurityBadge />
      <EncryptionBadge />
      <SOC2Badge />
    </div>
  );
}
