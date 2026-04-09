/**
 * Validation Types and Schemas
 * Runtime validation for reconciliation data
 */

import {
  ReconciliationTransaction,
  ReconciliationSettlement,
  ReconciliationException,
  ReconciliationRule,
  Money,
} from "./index";

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  path?: string[];
}

export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  path?: string[];
}

/**
 * Validation Rules
 */
export interface ValidationRules {
  transaction?: TransactionValidationRules;
  settlement?: SettlementValidationRules;
  exception?: ExceptionValidationRules;
  rule?: RuleValidationRules;
  money?: MoneyValidationRules;
}

export interface TransactionValidationRules {
  maxAmount?: number;
  minAmount?: number;
  allowedProviders?: string[];
  allowedCurrencies?: string[];
  requiredFields?: (keyof ReconciliationTransaction)[];
  dateRange?: {
    min?: string; // ISO 8601
    max?: string; // ISO 8601
  };
  idPattern?: string; // Regex
  referenceIdPattern?: string; // Regex
}

export interface SettlementValidationRules {
  maxAmount?: number;
  minAmount?: number;
  allowedProviders?: string[];
  allowedCurrencies?: string[];
  requiredFields?: (keyof ReconciliationSettlement)[];
  dateRange?: {
    min?: string;
    max?: string;
  };
}

export interface ExceptionValidationRules {
  allowedCategories?: string[];
  allowedSeverities?: string[];
  requiredFields?: (keyof ReconciliationException)[];
  descriptionMaxLength?: number;
}

export interface RuleValidationRules {
  allowedFields?: string[];
  allowedTypes?: string[];
  maxTolerance?: {
    amount?: number;
    days?: number;
    percentage?: number;
  };
  priorityRange?: {
    min: number;
    max: number;
  };
}

export interface MoneyValidationRules {
  maxValue?: number;
  minValue?: number;
  allowedCurrencies?: string[];
  precision?: number; // Decimal places
}

/**
 * Schema Validator Interface
 */
export interface SchemaValidator {
  validateTransaction(tx: ReconciliationTransaction): ValidationResult;
  validateSettlement(st: ReconciliationSettlement): ValidationResult;
  validateException(exc: ReconciliationException): ValidationResult;
  validateRule(rule: ReconciliationRule): ValidationResult;
  validateMoney(money: Money): ValidationResult;
}
