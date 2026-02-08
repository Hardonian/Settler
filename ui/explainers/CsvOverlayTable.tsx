import React from "react";

export type CsvOverlayStatus = "match" | "missing" | "drift" | "mismatch";

export type CsvOverlayAnnotation = {
  rowIndex: number;
  column?: string;
  status: CsvOverlayStatus;
  message?: string;
};

type CsvOverlayTableProps = {
  headers: string[];
  rows: string[][];
  annotations?: CsvOverlayAnnotation[];
  caption?: string;
};

const statusStyles: Record<CsvOverlayStatus, React.CSSProperties> = {
  match: { backgroundColor: "#e8f7ee", borderColor: "#21a366" },
  missing: { backgroundColor: "#fff3e0", borderColor: "#ff9800" },
  drift: { backgroundColor: "#e3f2fd", borderColor: "#1e88e5" },
  mismatch: { backgroundColor: "#fdecea", borderColor: "#d32f2f" },
};

const resolveAnnotation = (
  annotations: CsvOverlayAnnotation[] | undefined,
  rowIndex: number,
  column: string
) =>
  annotations?.find(
    (annotation) =>
      annotation.rowIndex === rowIndex &&
      (annotation.column === undefined || annotation.column === column)
  );

export const CsvOverlayTable = ({
  headers,
  rows,
  annotations = [],
  caption = "CSV annotation overlay",
}: CsvOverlayTableProps) => (
  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <caption style={{ textAlign: "left", padding: "8px 12px", color: "#475569" }}>
        {caption}
      </caption>
      <thead style={{ backgroundColor: "#f8fafc" }}>
        <tr>
          {headers.map((header) => (
            <th
              key={header}
              style={{
                textAlign: "left",
                fontWeight: 600,
                fontSize: 12,
                padding: "8px 12px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`row-${rowIndex}`}>
            {row.map((cell, cellIndex) => {
              const column = headers[cellIndex] ?? `Column ${cellIndex + 1}`;
              const annotation = resolveAnnotation(annotations, rowIndex, column);
              const style = annotation ? statusStyles[annotation.status] : undefined;

              return (
                <td
                  key={`${rowIndex}-${column}`}
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #e2e8f0",
                    borderLeft: cellIndex === 0 ? "none" : "1px solid #e2e8f0",
                    backgroundColor: style?.backgroundColor,
                    borderTop: annotation ? `2px solid ${style?.borderColor}` : undefined,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span>{cell || "—"}</span>
                    {annotation?.message ? (
                      <span style={{ fontSize: 11, color: "#475569" }}>{annotation.message}</span>
                    ) : null}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
