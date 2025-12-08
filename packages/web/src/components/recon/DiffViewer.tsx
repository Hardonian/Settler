/**
 * Diff Viewer Component
 * 
 * Visualizes reconciliation differences
 * Part of Section 3: UI/UX Design System
 */

import React from 'react';

interface DiffItem {
  field: string;
  source: any;
  target: any;
  status: 'matched' | 'unmatched' | 'conflict';
  confidence?: number;
}

interface DiffViewerProps {
  items: DiffItem[];
  onItemClick?: (item: DiffItem) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ items, onItemClick }) => {
  return (
    <div className="diff-viewer">
      <div className="diff-header">
        <h3>Reconciliation Results</h3>
        <div className="diff-stats">
          <span className="stat matched">Matched: {items.filter(i => i.status === 'matched').length}</span>
          <span className="stat unmatched">Unmatched: {items.filter(i => i.status === 'unmatched').length}</span>
          <span className="stat conflict">Conflicts: {items.filter(i => i.status === 'conflict').length}</span>
        </div>
      </div>
      <div className="diff-list">
        {items.map((item, index) => (
          <div
            key={index}
            className={`diff-item diff-item--${item.status}`}
            onClick={() => onItemClick?.(item)}
          >
            <div className="diff-field">{item.field}</div>
            <div className="diff-values">
              <div className="diff-value diff-value--source">
                <span className="diff-label">Source</span>
                <span className="diff-content">{JSON.stringify(item.source)}</span>
              </div>
              <div className="diff-value diff-value--target">
                <span className="diff-label">Target</span>
                <span className="diff-content">{JSON.stringify(item.target)}</span>
              </div>
            </div>
            {item.confidence && (
              <div className="diff-confidence">
                Confidence: {(item.confidence * 100).toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
