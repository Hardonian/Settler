/**
 * Route Documentation Generator
 * Auto-generates API documentation from route definitions
 */
export interface RouteDoc {
    path: string;
    method: string;
    params?: Record<string, string>;
    body?: Record<string, unknown>;
    response?: Record<string, unknown>;
    auth: boolean;
    permissions?: string[];
    description?: string;
    file: string;
    line?: number;
}
export interface DocumentationReport {
    totalRoutes: number;
    documentedRoutes: number;
    undocumentedRoutes: number;
    routes: RouteDoc[];
    generatedAt: Date;
}
/**
 * Generate route documentation from route files
 * This is a basic implementation that parses route files for patterns
 */
export declare function generateRouteDocs(): Promise<DocumentationReport>;
/**
 * Generate markdown documentation from route docs
 */
export declare function generateMarkdownDocs(report: DocumentationReport): Promise<string>;
/**
 * Save generated documentation to file
 */
export declare function saveRouteDocs(outputPath: string, report: DocumentationReport): Promise<void>;
//# sourceMappingURL=doc-generator.d.ts.map