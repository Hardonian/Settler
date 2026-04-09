/**
 * ExportButton Component
 * Export reconciliation data to various formats
 */

import { useCallback } from "react";
import { useCompilationContext } from "../context";
import { useTelemetry } from "../hooks/useTelemetry";
import { useSecurity } from "../hooks/useSecurity";

export interface ExportButtonProps {
  data: unknown[];
  filename?: string | undefined;
  format?: "csv" | "json" | "xlsx" | undefined;
  onExport?: ((format: string, data: unknown[]) => void) | undefined;
  className?: string | undefined;
  disabled?: boolean | undefined;
}

export function ExportButton({
  data,
  filename = "reconciliation-export",
  format = "csv",
  onExport,
  className,
  disabled = false,
}: ExportButtonProps) {
  const context = useCompilationContext();
  const { track } = useTelemetry("ExportButton");
  const { auditLog } = useSecurity();

  const handleExport = useCallback(() => {
    if (disabled || data.length === 0) {
      return;
    }

    track("export.started", { format, recordCount: data.length });
    auditLog("export.generated", `Export ${format}`, "success", {
      format,
      recordCount: data.length,
    });

    try {
      if (format === "csv") {
        exportToCSV(data, filename);
      } else if (format === "json") {
        exportToJSON(data, filename);
      } else if (format === "xlsx") {
        exportToXLSX(data, filename);
      }

      onExport?.(format, data);
      track("export.completed", { format, recordCount: data.length });
    } catch (error) {
      track("export.failed", {
        format,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      auditLog("export.generated", `Export ${format}`, "failure", {
        format,
        error: error instanceof Error ? error.message : "Unknown",
      });
    }
  }, [data, filename, format, onExport, disabled, track, auditLog]);

  // In config mode, register widget
  if (context.mode === "config") {
    if (!context.config.widgets) {
      context.config.widgets = {};
    }
    context.config.widgets["export-button"] = {
      id: "export-button",
      type: "filter-bar", // Reuse type
      props: { format },
    };
    return null;
  }

  // UI mode
  return (
    <button
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className={className}
      data-widget="export-button"
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "6px",
        border: "1px solid #d1d5db",
        backgroundColor: disabled ? "#f3f4f6" : "white",
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: "0.875rem",
        fontWeight: "500",
      }}
    >
      Export {format.toUpperCase()}
    </button>
  );
}

function exportToCSV(data: unknown[], filename: string): void {
  if (data.length === 0) {
    return;
  }

  const headers = Object.keys(data[0] as Record<string, unknown>);
  const rows = data.map((item) => {
    const record = item as Record<string, unknown>;
    return headers.map((header) => {
      const value = record[header];
      if (value === null || value === undefined) {
        return "";
      }
      // Escape commas and quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
  });

  const csvContent = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  downloadFile(csvContent, `${filename}.csv`, "text/csv");
}

function exportToJSON(data: unknown[], filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, "application/json");
}

function exportToXLSX(data: unknown[], filename: string): void {
  // For XLSX, we'd need a library like xlsx
  // For now, fall back to CSV
  console.warn("XLSX export requires xlsx library. Falling back to CSV.");
  exportToCSV(data, filename);
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
