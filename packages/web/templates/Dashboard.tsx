/**
 * Dashboard Page Template
 * 
 * Main dashboard for Settler.dev
 * Part of Section 3: UI/UX Design System
 */

import React from 'react';
import { DiffViewer } from '../src/components/recon/DiffViewer';
import { SchemaInspector } from '../src/components/recon/SchemaInspector';

export const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-actions">
          <button className="btn btn-primary">New Reconciliation</button>
          <button className="btn btn-secondary">Create Workflow</button>
        </div>
      </div>
      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Recent Reconciliations</h2>
          <DiffViewer
            items={[
              {
                field: 'amount',
                source: 100.00,
                target: 100.00,
                status: 'matched',
                confidence: 1.0,
              },
              {
                field: 'currency',
                source: 'USD',
                target: 'USD',
                status: 'matched',
                confidence: 1.0,
              },
            ]}
          />
        </div>
        <div className="dashboard-section">
          <h2>Schema Inspector</h2>
          <SchemaInspector
            schema={{
              name: 'Payment Schema',
              version: '1.0.0',
              fields: [
                { name: 'id', type: 'string', required: true },
                { name: 'amount', type: 'number', required: true },
                { name: 'currency', type: 'string', required: true },
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
};
