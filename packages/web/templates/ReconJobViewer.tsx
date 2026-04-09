/**
 * Reconciliation Job Viewer Page Template
 *
 * Part of Section 3: UI/UX Design System
 */

import React, { useState } from "react";
import { DiffViewer } from "../src/components/recon/DiffViewer";

export const ReconJobViewer: React.FC<{ jobId: string }> = ({ jobId }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "results" | "drift" | "audit">(
    "overview"
  );

  return (
    <div className="recon-job-viewer">
      <div className="job-header">
        <h1>Reconciliation Job: {jobId}</h1>
        <div className="job-actions">
          <button className="btn btn-primary">Execute</button>
          <button className="btn btn-secondary">Edit</button>
        </div>
      </div>
      <div className="job-tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "results" ? "active" : ""}`}
          onClick={() => setActiveTab("results")}
        >
          Results
        </button>
        <button
          className={`tab ${activeTab === "drift" ? "active" : ""}`}
          onClick={() => setActiveTab("drift")}
        >
          Drift Detection
        </button>
        <button
          className={`tab ${activeTab === "audit" ? "active" : ""}`}
          onClick={() => setActiveTab("audit")}
        >
          Audit Trail
        </button>
      </div>
      <div className="job-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="job-info">
              <h2>Job Configuration</h2>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Source Adapter:</span>
                  <span className="info-value">Stripe</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Target Adapter:</span>
                  <span className="info-value">Internal Ledger</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Strategy:</span>
                  <span className="info-value">Deterministic</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-value status-active">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "results" && (
          <div className="results-tab">
            <DiffViewer
              items={[
                {
                  field: "transaction_123",
                  source: { amount: 100, currency: "USD" },
                  target: { amount: 100, currency: "USD" },
                  status: "matched",
                  confidence: 1.0,
                },
              ]}
            />
          </div>
        )}
        {activeTab === "drift" && (
          <div className="drift-tab">
            <h2>Drift Events</h2>
            <p>No drift detected</p>
          </div>
        )}
        {activeTab === "audit" && (
          <div className="audit-tab">
            <h2>Audit Trail</h2>
            <div className="audit-log">
              <div className="audit-entry">
                <span className="audit-time">2025-01-20 10:00:00</span>
                <span className="audit-action">Job created</span>
                <span className="audit-user">user@example.com</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
