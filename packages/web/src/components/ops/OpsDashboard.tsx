/**
 * Ops Dashboard Component
 * 
 * Main dashboard with tabs for different operational views
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpsOverview } from './tabs/OpsOverview';
import { OpsCustomers } from './tabs/OpsCustomers';
import { OpsUsage } from './tabs/OpsUsage';
import { OpsJobs } from './tabs/OpsJobs';
import { OpsWebhooks } from './tabs/OpsWebhooks';
import { OpsErrors } from './tabs/OpsErrors';
import { OpsBilling } from './tabs/OpsBilling';
import { OpsExports } from './tabs/OpsExports';
import { OpsRunbooks } from './tabs/OpsRunbooks';

interface OpsDashboardProps {
  userId: string;
}

export function OpsDashboard({ userId: _userId }: OpsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
          <TabsTrigger value="runbooks">Runbooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OpsOverview />
        </TabsContent>

        <TabsContent value="customers" className="mt-6">
          <OpsCustomers />
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <OpsUsage />
        </TabsContent>

        <TabsContent value="jobs" className="mt-6">
          <OpsJobs />
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6">
          <OpsWebhooks />
        </TabsContent>

        <TabsContent value="errors" className="mt-6">
          <OpsErrors />
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <OpsBilling />
        </TabsContent>

        <TabsContent value="exports" className="mt-6">
          <OpsExports />
        </TabsContent>

        <TabsContent value="runbooks" className="mt-6">
          <OpsRunbooks />
        </TabsContent>
      </Tabs>
    </div>
  );
}
