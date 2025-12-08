/**
 * User Domain Entity
 * Represents a user in the system with authentication and authorization capabilities
 */

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  DEVELOPER = 'developer',
  VIEWER = 'viewer',
}

export interface UserProps {
  id: string;
  tenantId: string; // Multi-tenancy: user belongs to a tenant
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

export class User {
  private constructor(private props: UserProps) {}

  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    return new User({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get dataResidencyRegion(): string {
    return this.props.dataResidencyRegion;
  }

  get dataRetentionDays(): number {
    return this.props.dataRetentionDays;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  get deletionScheduledAt(): Date | undefined {
    return this.props.deletionScheduledAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  scheduleDeletion(gracePeriodDays: number = 30): void {
    this.props.deletionScheduledAt = new Date(
      Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000
    );
  }

  markAsDeleted(): void {
    this.props.deletedAt = new Date();
    this.props.updatedAt = new Date();
  }

  updatePassword(newPasswordHash: string): void {
    this.props.passwordHash = newPasswordHash;
    this.props.updatedAt = new Date();
  }

  updateProfile(data: { name?: string; dataRetentionDays?: number }): void {
    if (data.name !== undefined) {
      this.props.name = data.name;
    }
    if (data.dataRetentionDays !== undefined) {
      this.props.dataRetentionDays = data.dataRetentionDays;
    }
    this.props.updatedAt = new Date();
  }

  toPersistence(): UserProps {
    return { ...this.props };
  }
}
