/**
 * Schema Validation on Startup
 * Validates database schema matches expectations before starting the application
 */
/**
 * Validate database schema on startup
 * Throws error if critical tables are missing
 */
export declare function validateSchema(): Promise<void>;
/**
 * Check if migrations are up to date
 * Compares applied migrations with available migration files
 */
export declare function checkMigrationsStatus(): Promise<{
    applied: number;
    pending: string[];
    upToDate: boolean;
}>;
//# sourceMappingURL=schema-validation.d.ts.map