/**
 * ExportButton Component
 * Export reconciliation data to various formats
 */
export interface ExportButtonProps {
    data: unknown[];
    filename?: string | undefined;
    format?: 'csv' | 'json' | 'xlsx' | undefined;
    onExport?: ((format: string, data: unknown[]) => void) | undefined;
    className?: string | undefined;
    disabled?: boolean | undefined;
}
export declare function ExportButton({ data, filename, format, onExport, className, disabled }: ExportButtonProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=ExportButton.d.ts.map