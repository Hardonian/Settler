/**
 * Schema Inspector Component
 *
 * Visualizes and inspects data schemas
 * Part of Section 3: UI/UX Design System
 */

import React, { useState } from "react";

interface SchemaField {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  example?: any;
}

interface SchemaInspectorProps {
  schema: {
    fields: SchemaField[];
    name?: string;
    version?: string;
  };
  onFieldSelect?: (field: SchemaField) => void;
}

export const SchemaInspector: React.FC<SchemaInspectorProps> = ({ schema, onFieldSelect }) => {
  const [selectedField, setSelectedField] = useState<SchemaField | null>(null);

  const handleFieldClick = (field: SchemaField) => {
    setSelectedField(field);
    onFieldSelect?.(field);
  };

  return (
    <div className="schema-inspector">
      <div className="schema-header">
        {schema.name && <h3>{schema.name}</h3>}
        {schema.version && <span className="schema-version">v{schema.version}</span>}
      </div>
      <div className="schema-content">
        <div className="schema-fields">
          {schema.fields.map((field, index) => (
            <div
              key={index}
              className={`schema-field ${selectedField?.name === field.name ? "selected" : ""}`}
              onClick={() => handleFieldClick(field)}
            >
              <div className="field-name">
                {field.name}
                {field.required && <span className="field-required">*</span>}
              </div>
              <div className="field-type">{field.type}</div>
              {field.description && <div className="field-description">{field.description}</div>}
            </div>
          ))}
        </div>
        {selectedField && (
          <div className="schema-details">
            <h4>{selectedField.name}</h4>
            <div className="detail-item">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{selectedField.type}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Required:</span>
              <span className="detail-value">{selectedField.required ? "Yes" : "No"}</span>
            </div>
            {selectedField.description && (
              <div className="detail-item">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{selectedField.description}</span>
              </div>
            )}
            {selectedField.example && (
              <div className="detail-item">
                <span className="detail-label">Example:</span>
                <pre className="detail-value">{JSON.stringify(selectedField.example, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
