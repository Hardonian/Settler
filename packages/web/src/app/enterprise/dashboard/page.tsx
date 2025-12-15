/**
 * Enterprise Dashboard Page
 * 
 * Centralized management for enterprise features:
 * - RBAC management
 * - IP allowlist
 * - Usage quotas
 * - Multi-project management
 * - API quota management
 */

'use client';

import { Suspense } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RBACManager } from '@/components/enterprise/RBACManager';
import { IPAllowlistManager } from '@/components/enterprise/IPAllowlistManager';
import { MultiProjectManager } from '@/components/enterprise/MultiProjectManager';
import { UsageCalculator } from '@/components/enterprise/UsageCalculator';
import { APIQuotaManager } from '@/components/enterprise/APIQuotaManager';
import { Shield, Network, FolderTree, Calculator, Gauge } from 'lucide-react';

export default function EnterpriseDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-black">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        <Breadcrumbs items={[
          { label: 'Enterprise', href: '/enterprise' },
          { label: 'Dashboard' },
        ]} />

        <div className="mt-8 mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Enterprise Dashboard
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400">
            Manage your enterprise settings, security, and resources in one place.
          </p>
        </div>

        <Tabs defaultValue="rbac" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="rbac" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              RBAC
            </TabsTrigger>
            <TabsTrigger value="ip" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              IP Allowlist
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="quotas" className="flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Quotas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rbac" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Role-Based Access Control</CardTitle>
                <CardDescription>
                  Manage user roles and permissions across your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading RBAC...</div>}>
                  <RBACManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ip" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>IP Allowlist</CardTitle>
                <CardDescription>
                  Restrict API access to specific IP addresses or ranges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading IP allowlist...</div>}>
                  <IPAllowlistManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Project Management</CardTitle>
                <CardDescription>
                  Organize your reconciliation jobs into projects and manage access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading projects...</div>}>
                  <MultiProjectManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Usage Calculator</CardTitle>
                <CardDescription>
                  Estimate costs and usage for your reconciliation needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading calculator...</div>}>
                  <UsageCalculator />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>API Quota Management</CardTitle>
                <CardDescription>
                  Configure rate limits and quotas for your API keys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Loading quotas...</div>}>
                  <APIQuotaManager />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
