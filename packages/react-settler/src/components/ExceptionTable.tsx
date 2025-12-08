/**
 * ExceptionTable
 * Displays reconciliation exceptions requiring manual review
 */

import React, { useMemo } from 'react';
import { ReconciliationException, sanitizeString } from '@settler/protocol';
import { useCompilationContext } from '../context';
import { useTelemetry } from '../hooks/useTelemetry';

export interface ExceptionTableProps {
  exceptions: ReconciliationException[];
  onResolve?: (exception: ReconciliationException) => void;
  className?: string;
  showSeverity?: boolean;
  showCategory?: boolean;
}

export const ExceptionTable = React.memo(function ExceptionTable({
  exceptions,
  onResolve,
  className,
  showSeverity = true,
  showCategory = true
}: ExceptionTableProps) {
  const context = useCompilationContext();
  const { track } = useTelemetry('ExceptionTable');

  // Sanitize exception descriptions
  const sanitizedExceptions = useMemo(() => {
    return exceptions.map(exc => ({
      ...exc,
      description: sanitizeString(exc.description)
    }));
  }, [exceptions]);

  // In config mode, register widget
  if (context.mode === 'config') {
    if (!context.config.widgets) {
      context.config.widgets = {};
    }
    context.config.widgets['exception-table'] = {
      id: 'exception-table',
      type: 'exception-table',
      props: {
        showSeverity,
        showCategory
      }
    };
  }

  // In UI mode, render table
  if (context.mode === 'ui') {
    return (
      <div className={className} data-widget="exception-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              {showCategory && <th>Category</th>}
              {showSeverity && <th>Severity</th>}
              <th>Description</th>
              <th>Status</th>
              {onResolve && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sanitizedExceptions.map((exception) => (
              <tr key={exception.id}>
                <td>{exception.id}</td>
                {showCategory && <td>{exception.category}</td>}
                {showSeverity && (
                  <td>
                    <span data-severity={exception.severity}>
                      {exception.severity}
                    </span>
                  </td>
                )}
                <td>{exception.description}</td>
                <td>{exception.resolutionStatus}</td>
                {onResolve && (
                  <td>
                    <button
                      onClick={() => {
                        track('exception.resolved', { exceptionId: exception.id });
                        onResolve(exception);
                      }}
                    >
                      Resolve
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Config mode: return null (widget registered above)
  return null;
});
