"use strict";
/**
 * User Domain Entity
 * Represents a user in the system with authentication and authorization capabilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["OWNER"] = "owner";
    UserRole["ADMIN"] = "admin";
    UserRole["DEVELOPER"] = "developer";
    UserRole["VIEWER"] = "viewer";
})(UserRole || (exports.UserRole = UserRole = {}));
class User {
    props;
    constructor(props) {
        this.props = props;
    }
    static create(props) {
        return new User({
            ...props,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    static fromPersistence(props) {
        return new User(props);
    }
    get id() {
        return this.props.id;
    }
    get tenantId() {
        return this.props.tenantId;
    }
    get email() {
        return this.props.email;
    }
    get passwordHash() {
        return this.props.passwordHash;
    }
    get name() {
        return this.props.name;
    }
    get role() {
        return this.props.role;
    }
    get dataResidencyRegion() {
        return this.props.dataResidencyRegion;
    }
    get dataRetentionDays() {
        return this.props.dataRetentionDays;
    }
    get deletedAt() {
        return this.props.deletedAt;
    }
    get deletionScheduledAt() {
        return this.props.deletionScheduledAt;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    isDeleted() {
        return !!this.props.deletedAt;
    }
    scheduleDeletion(gracePeriodDays = 30) {
        this.props.deletionScheduledAt = new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000);
    }
    markAsDeleted() {
        this.props.deletedAt = new Date();
        this.props.updatedAt = new Date();
    }
    updatePassword(newPasswordHash) {
        this.props.passwordHash = newPasswordHash;
        this.props.updatedAt = new Date();
    }
    updateProfile(data) {
        if (data.name !== undefined) {
            this.props.name = data.name;
        }
        if (data.dataRetentionDays !== undefined) {
            this.props.dataRetentionDays = data.dataRetentionDays;
        }
        this.props.updatedAt = new Date();
    }
    toPersistence() {
        return { ...this.props };
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map