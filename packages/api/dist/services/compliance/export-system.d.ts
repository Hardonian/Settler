/**
 * Compliance Export System
 *
 * One-click compliance exports for any jurisdiction (GDPR, CCPA, SOC 2, etc.)
 */
import { EventEmitter } from 'events';
export interface ComplianceExport {
    id: string;
    customerId: string;
    jurisdiction: 'GDPR' | 'CCPA' | 'SOC2' | 'PCI-DSS' | 'HIPAA' | 'custom';
    format: 'json' | 'csv' | 'xml' | 'pdf';
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
    downloadUrl?: string;
    data: Record<string, unknown>;
}
export interface ExportTemplate {
    jurisdiction: string;
    fields: string[];
    format: ComplianceExport['format'];
    description: string;
}
export declare class ComplianceExportSystem extends EventEmitter {
    private exports;
    private templates;
    constructor();
    /**
     * Initialize export templates
     */
    private initializeTemplates;
    /**
     * Create a compliance export
     */
    createExport(customerId: string, jurisdiction: ComplianceExport['jurisdiction'], format?: ComplianceExport['format']): Promise<ComplianceExport>;
    /**
     * Process an export
     */
    private processExport;
    /**
     * Fetch export data (mock implementation)
     */
    private fetchExportData;
    /**
     * Format data according to jurisdiction and format
     */
    private formatData;
    /**
     * Convert object to CSV
     */
    private objectToCSV;
    /**
     * Convert object to XML
     */
    private objectToXML;
    /**
     * Generate download URL
     */
    private generateDownloadUrl;
    /**
     * Get export by ID
     */
    getExport(exportId: string): ComplianceExport | undefined;
    /**
     * List exports for a customer
     */
    listExports(customerId: string): ComplianceExport[];
    /**
     * Get available templates
     */
    getTemplates(): ExportTemplate[];
}
export declare const complianceExportSystem: ComplianceExportSystem;
//# sourceMappingURL=export-system.d.ts.map