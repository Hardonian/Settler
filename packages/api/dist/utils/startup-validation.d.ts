/**
 * Startup Validation
 * Validates environment, dependencies, and configuration at application startup
 */
export interface ValidationResult {
    name: string;
    status: 'ok' | 'warning' | 'error';
    message: string;
}
export interface StartupValidation {
    passed: boolean;
    results: ValidationResult[];
}
/**
 * Run all startup validations
 */
export declare function validateStartup(): Promise<StartupValidation>;
//# sourceMappingURL=startup-validation.d.ts.map