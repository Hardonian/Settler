"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMissingOptionalCapabilityDependency = isMissingOptionalCapabilityDependency;
const pg_errors_1 = require("./pg-errors");
function isMissingOptionalCapabilityDependency(error) {
    return (0, pg_errors_1.isUndefinedTableError)(error);
}
//# sourceMappingURL=errors.js.map