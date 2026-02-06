"use strict";
/**
 * Tenant Domain Entity
 * Represents a tenant in the multi-tenant system with hierarchy support
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tenant = exports.TenantStatus = exports.TenantTier = void 0;
var TenantTier;
(function (TenantTier) {
    TenantTier["FREE"] = "free";
    TenantTier["STARTER"] = "starter";
    TenantTier["GROWTH"] = "growth";
    TenantTier["SCALE"] = "scale";
    TenantTier["ENTERPRISE"] = "enterprise";
})(TenantTier || (exports.TenantTier = TenantTier = {}));
var TenantStatus;
(function (TenantStatus) {
    TenantStatus["ACTIVE"] = "active";
    TenantStatus["SUSPENDED"] = "suspended";
    TenantStatus["TRIAL"] = "trial";
    TenantStatus["CANCELLED"] = "cancelled";
})(TenantStatus || (exports.TenantStatus = TenantStatus = {}));
class Tenant {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        return new Tenant({
            ...props,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    static fromPersistence(props) {
        return new Tenant(props);
    }
    get id() {
        return this.props.id;
    }
    get name() {
        return this.props.name;
    }
    get slug() {
        return this.props.slug;
    }
    get parentTenantId() {
        return this.props.parentTenantId;
    }
    get tier() {
        return this.props.tier;
    }
    get status() {
        return this.props.status;
    }
    get quotas() {
        return { ...this.props.quotas };
    }
    get config() {
        return { ...this.props.config };
    }
    get metadata() {
        return { ...this.props.metadata };
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    get deletedAt() {
        return this.props.deletedAt;
    }
    isDeleted() {
        return !!this.props.deletedAt;
    }
    isEnterprise() {
        return this.props.tier === TenantTier.ENTERPRISE;
    }
    isSubAccount() {
        return !!this.props.parentTenantId;
    }
    updateTier(tier) {
        this.props.tier = tier;
        this.props.updatedAt = new Date();
    }
    updateStatus(status) {
        this.props.status = status;
        this.props.updatedAt = new Date();
    }
    updateQuotas(quotas) {
        this.props.quotas = { ...this.props.quotas, ...quotas };
        this.props.updatedAt = new Date();
    }
    updateConfig(config) {
        this.props.config = { ...this.props.config, ...config };
        this.props.updatedAt = new Date();
    }
    updateMetadata(metadata) {
        this.props.metadata = { ...this.props.metadata, ...metadata };
        this.props.updatedAt = new Date();
    }
    setCustomDomain(domain, verified = false) {
        this.props.config.customDomain = domain;
        this.props.config.customDomainVerified = verified;
        this.props.updatedAt = new Date();
    }
    markAsDeleted() {
        this.props.deletedAt = new Date();
        this.props.updatedAt = new Date();
    }
    toPersistence() {
        return { ...this.props };
    }
}
exports.Tenant = Tenant;
//# sourceMappingURL=Tenant.js.map