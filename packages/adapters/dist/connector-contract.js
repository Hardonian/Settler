"use strict";
/**
 * Connector Interface Contract
 *
 * This is the public contract that third-party connectors must implement.
 * External developers can build connectors without reading internal code.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_VALIDATION_RULES = exports.ValidationError = exports.ConnectorError = void 0;
exports.validateConnector = validateConnector;
/**
 * Connector error for standardized error handling
 */
class ConnectorError extends Error {
    code;
    connector;
    cause;
    constructor(message, code, connector, cause) {
        super(message);
        this.code = code;
        this.connector = connector;
        this.cause = cause;
        this.name = "ConnectorError";
    }
}
exports.ConnectorError = ConnectorError;
/**
 * Validation error for data normalization failures
 */
class ValidationError extends Error {
    field;
    value;
    constructor(message, field, value) {
        super(message);
        this.field = field;
        this.value = value;
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
/**
 * Default validation rules for connectors
 */
exports.DEFAULT_VALIDATION_RULES = {
    minInterfaceVersion: "1.0.0",
    requiredMethods: ["name", "version", "fetch", "normalize", "validate"],
    dataValidation: {
        requiredFields: ["id", "amount", "currency", "date"],
        fieldTypes: {
            id: "string",
            amount: "number",
            currency: "string",
            date: "date",
            metadata: "object",
        },
    },
    security: {
        requiresHttps: true,
        credentialEncryption: "required",
    },
};
/**
 * Validate connector implementation against contract
 */
function validateConnector(connector, rules = exports.DEFAULT_VALIDATION_RULES) {
    const errors = [];
    // Check required methods
    for (const method of rules.requiredMethods) {
        if (!(method in connector) || typeof connector[method] !== "function") {
            errors.push(`Missing required method: ${method}`);
        }
    }
    // Validate name
    if (!connector.name || typeof connector.name !== "string") {
        errors.push("Connector name must be a non-empty string");
    }
    // Validate version
    if (!connector.version || typeof connector.version !== "string") {
        errors.push("Connector version must be a non-empty string");
    }
    // Test normalize with sample data
    try {
        const normalized = connector.normalize({});
        const validation = connector.validate(normalized);
        if (!validation.valid) {
            errors.push(`Validation failed: ${validation.errors?.join(", ")}`);
        }
    }
    catch (error) {
        errors.push(`Normalize/validate test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return {
        valid: errors.length === 0,
        ...(errors.length > 0 ? { errors } : {}),
    };
}
//# sourceMappingURL=connector-contract.js.map