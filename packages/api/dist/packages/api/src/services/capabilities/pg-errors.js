"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PG_UNDEFINED_TABLE = void 0;
exports.isUndefinedTableError = isUndefinedTableError;
exports.PG_UNDEFINED_TABLE = "42P01";
function isUndefinedTableError(error) {
    return Boolean(error && typeof error === "object" && error.code === exports.PG_UNDEFINED_TABLE);
}
//# sourceMappingURL=pg-errors.js.map