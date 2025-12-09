/**
 * User Domain Entity
 * Represents a user in the system with authentication and authorization capabilities
 */
export declare enum UserRole {
    OWNER = "owner",
    ADMIN = "admin",
    DEVELOPER = "developer",
    VIEWER = "viewer"
}
export interface UserProps {
    id: string;
    tenantId: string;
    email: string;
    passwordHash: string;
    name?: string;
    role: UserRole;
    dataResidencyRegion: string;
    dataRetentionDays: number;
    deletedAt?: Date;
    deletionScheduledAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class User {
    private props;
    private constructor();
    static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User;
    static fromPersistence(props: UserProps): User;
    get id(): string;
    get tenantId(): string;
    get email(): string;
    get passwordHash(): string;
    get name(): string | undefined;
    get role(): UserRole;
    get dataResidencyRegion(): string;
    get dataRetentionDays(): number;
    get deletedAt(): Date | undefined;
    get deletionScheduledAt(): Date | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    isDeleted(): boolean;
    scheduleDeletion(gracePeriodDays?: number): void;
    markAsDeleted(): void;
    updatePassword(newPasswordHash: string): void;
    updateProfile(data: {
        name?: string;
        dataRetentionDays?: number;
    }): void;
    toPersistence(): UserProps;
}
//# sourceMappingURL=User.d.ts.map