/**
 * Workflow Builder Component
 * 
 * Drag-and-drop workflow orchestration
 * Part of Section 3: UI/UX Design System
 */

import React, { useState } from 'react';

export type WorkflowStepType = 
  | 'ingestion'
  | 'transform'
  | 'validate'
  | 'map'
  | 'recon'
  | 'drift_detection'
  | 'audit'
  | 'webhook'
  | 'conditional'
  | 'loop'
  | 'timer';

interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  connections?: string[];
}

interface WorkflowBuilderProps {
  initialSteps?: WorkflowStep[];
  onSave?: (steps: WorkflowStep[]) => void;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ initialSteps = [], onSave }) => {
  const [steps, setSteps] = useState<WorkflowStep[]>(initialSteps);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);

  const stepTypes: Array<{ type: WorkflowStepType; label: string; icon: string }> = [
    { type: 'ingestion', label: 'Ingestion', icon: '📥' },
    { type: 'transform', label: 'Transform', icon: '🔄' },
    { type: 'validate', label: 'Validate', icon: '✓' },
    { type: 'map', label: 'Map', icon: '🗺️' },
    { type: 'recon', label: 'Recon', icon: '🔍' },
    { type: 'drift_detection', label: 'Drift Detection', icon: '📊' },
    { type: 'audit', label: 'Audit', icon: '📋' },
    { type: 'webhook', label: 'Webhook', icon: '🔔' },
    { type: 'conditional', label: 'Conditional', icon: '❓' },
    { type: 'loop', label: 'Loop', icon: '🔁' },
    { type: 'timer', label: 'Timer', icon: '⏱️' },
  ];

  const addStep = (type: WorkflowStepType) => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      type,
      label: stepTypes.find(s => s.type === type)?.label || type,
      config: {},
      position: { x: 100, y: 100 + steps.length * 150 },
    };
    setSteps([...steps, newStep]);
  };

  const handleSave = () => {
    onSave?.(steps);
  };

  return (
    <div className="workflow-builder">
      <div className="workflow-toolbar">
        <div className="step-palette">
          {stepTypes.map(stepType => (
            <button
              key={stepType.type}
              className="step-type-button"
              onClick={() => addStep(stepType.type)}
              title={stepType.label}
            >
              <span className="step-icon">{stepType.icon}</span>
              <span className="step-label">{stepType.label}</span>
            </button>
          ))}
        </div>
        <button className="save-button" onClick={handleSave}>
          Save Workflow
        </button>
      </div>
      <div className="workflow-canvas">
        {steps.map(step => (
          <div
            key={step.id}
            className={`workflow-step workflow-step--${step.type} ${selectedStep?.id === step.id ? 'selected' : ''}`}
            style={{ left: step.position.x, top: step.position.y }}
            onClick={() => setSelectedStep(step)}
          >
            <div className="step-header">
              <span className="step-icon">
                {stepTypes.find(s => s.type === step.type)?.icon}
              </span>
              <span className="step-label">{step.label}</span>
            </div>
            {selectedStep?.id === step.id && (
              <div className="step-config">
                <input
                  type="text"
                  value={step.label}
                  onChange={(e) => {
                    const updated = steps.map(s =>
                      s.id === step.id ? { ...s, label: e.target.value } : s
                    );
                    setSteps(updated);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
