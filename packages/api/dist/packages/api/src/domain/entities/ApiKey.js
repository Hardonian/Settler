"use strict";
/**
 * API Key Domain Entity
 * Represents an API key with scoped permissions and rate limiting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKey = void 0;
class ApiKey {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        return new ApiKey({
            ...props,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    static fromPersistence(props) {
        return new ApiKey(props);
    }
    get id() {
        return this.props.id;
    }
    get userId() {
        return this.props.userId;
    }
    get keyPrefix() {
        return this.props.keyPrefix;
    }
    get keyHash() {
        return this.props.keyHash;
    }
    get name() {
        return this.props.name;
    }
    get scopes() {
        return [...this.props.scopes];
    }
    get rateLimit() {
        return this.props.rateLimit;
    }
    get ipWhitelist() {
        return this.props.ipWhitelist;
    }
    get revokedAt() {
        return this.props.revokedAt;
    }
    get expiresAt() {
        return this.props.expiresAt;
    }
    get lastUsedAt() {
        return this.props.lastUsedAt;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    isRevoked() {
        return !!this.props.revokedAt;
    }
    isExpired() {
        if (!this.props.expiresAt) {
            return false;
        }
        return this.props.expiresAt < new Date();
    }
    isValid() {
        return !this.isRevoked() && !this.isExpired();
    }
    hasScope(scope) {
        return this.props.scopes.includes(scope) || this.props.scopes.includes('*');
    }
    isIpAllowed(ip) {
        if (!this.props.ipWhitelist || this.props.ipWhitelist.length === 0) {
            return true;
        }
        return this.props.ipWhitelist.includes(ip);
    }
    revoke() {
        this.props.revokedAt = new Date();
        this.props.updatedAt = new Date();
    }
    recordUsage() {
        this.props.lastUsedAt = new Date();
        this.props.updatedAt = new Date();
    }
    updateScopes(scopes) {
        this.props.scopes = scopes;
        this.props.updatedAt = new Date();
    }
    updateRateLimit(rateLimit) {
        this.props.rateLimit = rateLimit;
        this.props.updatedAt = new Date();
    }
    toPersistence() {
        return { ...this.props };
    }
}
exports.ApiKey = ApiKey;
//# sourceMappingURL=ApiKey.js.map