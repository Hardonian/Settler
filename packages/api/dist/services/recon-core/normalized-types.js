"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecordDirection = exports.RecordType = void 0;
var RecordType;
(function (RecordType) {
    RecordType["CHARGE"] = "CHARGE";
    RecordType["REFUND"] = "REFUND";
    RecordType["PAYOUT"] = "PAYOUT";
    RecordType["FEE"] = "FEE";
    RecordType["TRANSFER"] = "TRANSFER";
    RecordType["ADJUSTMENT"] = "ADJUSTMENT";
})(RecordType || (exports.RecordType = RecordType = {}));
var RecordDirection;
(function (RecordDirection) {
    RecordDirection["INCOMING"] = "INCOMING";
    RecordDirection["OUTGOING"] = "OUTGOING"; // Money leaving the account
})(RecordDirection || (exports.RecordDirection = RecordDirection = {}));
//# sourceMappingURL=normalized-types.js.map