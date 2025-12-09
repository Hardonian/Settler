"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashApiKey = hashApiKey;
exports.verifyApiKey = verifyApiKey;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateApiKey = generateApiKey;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const SALT_ROUNDS = 12;
async function hashApiKey(apiKey) {
    return bcrypt_1.default.hash(apiKey, SALT_ROUNDS);
}
async function verifyApiKey(apiKey, hash) {
    return bcrypt_1.default.compare(apiKey, hash);
}
async function hashPassword(password) {
    return bcrypt_1.default.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
    return bcrypt_1.default.compare(password, hash);
}
function generateApiKey() {
    const randomBytes = crypto_1.default.randomBytes(32);
    const key = `rk_${randomBytes.toString('base64url')}`;
    const prefix = key.substring(0, 12); // First 12 characters for lookup
    return { key, prefix };
}
//# sourceMappingURL=hash.js.map