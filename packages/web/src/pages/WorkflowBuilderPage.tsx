/**
 * Workflow Builder Page Template
 * 
 * Part of Section 3: UI/UX Design System
 */

import React from 'react';
import { WorkflowBuilder } from '../components/workflows/WorkflowBuilder';

interface WorkflowStep {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
  connections?: string[];
}

export const WorkflowBuilderPage: React.FC = () => {
  const handleSave = (steps: WorkflowStep[]) => {
    console.log('Saving workflow:', steps);
    // TODO: Save to API
  };

  return (
    <div className="workflow-builder-page">
      <div className="page-header">
        <h1>Workflow Builder</h1>
        <p>Drag and drop steps to create your workflow</p>
      </div>
      <WorkflowBuilder onSave={handleSave} />
    </div>
  );
};
