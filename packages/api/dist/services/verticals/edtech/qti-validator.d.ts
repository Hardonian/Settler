/**
 * EdTech Module - QTI Validator
 *
 * Part of Phase IV: Vertical Modules
 */
export interface QTIValidationResult {
    valid: boolean;
    errors: Array<{
        line: number;
        message: string;
        severity: 'error' | 'warning';
    }>;
    warnings: string[];
}
export declare class QTIValidator {
    /**
     * Validate QTI (Question and Test Interoperability) format
     */
    validateQTI(_qtiContent: string): Promise<QTIValidationResult>;
    /**
     * Validate learning outcome mapping
     */
    validateLearningOutcomes(_syllabus: unknown, _outcomes: unknown[]): Promise<{
        valid: boolean;
        missing: string[];
        extra: string[];
    }>;
    /**
     * Check LMS compatibility
     */
    checkLMSCompatibility(_qtiContent: string, _lms: 'canvas' | 'blackboard' | 'moodle' | 'brightspace'): Promise<{
        compatible: boolean;
        issues: string[];
    }>;
}
//# sourceMappingURL=qti-validator.d.ts.map