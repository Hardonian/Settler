/**
 * API Key Domain Entity
 * Represents an API key with scoped permissions and rate limiting
 */

export interface ApiKeyProps {
  id: string;
  userId: string;
  keyPrefix: string;
  keyHash: string;
  name?: string;
  scopes: string[];
  rateLimit: number;
  ipWhitelist?: string[];
  revokedAt?: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class ApiKey {
  private constructor(private props: ApiKeyProps) {}

  static create(props: Omit<ApiKeyProps, "id" | "createdAt" | "updatedAt">): ApiKey {
    return new ApiKey({
      ...props,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: ApiKeyProps): ApiKey {
    return new ApiKey(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get keyPrefix(): string {
    return this.props.keyPrefix;
  }

  get keyHash(): string {
    return this.props.keyHash;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get scopes(): string[] {
    return [...this.props.scopes];
  }

  get rateLimit(): number {
    return this.props.rateLimit;
  }

  get ipWhitelist(): string[] | undefined {
    return this.props.ipWhitelist;
  }

  get revokedAt(): Date | undefined {
    return this.props.revokedAt;
  }

  get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  get lastUsedAt(): Date | undefined {
    return this.props.lastUsedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isRevoked(): boolean {
    return !!this.props.revokedAt;
  }

  isExpired(): boolean {
    if (!this.props.expiresAt) {
      return false;
    }
    return this.props.expiresAt < new Date();
  }

  isValid(): boolean {
    return !this.isRevoked() && !this.isExpired();
  }

  hasScope(scope: string): boolean {
    return this.props.scopes.includes(scope) || this.props.scopes.includes("*");
  }

  isIpAllowed(ip: string): boolean {
    if (!this.props.ipWhitelist || this.props.ipWhitelist.length === 0) {
      return true;
    }
    return this.props.ipWhitelist.includes(ip);
  }

  revoke(): void {
    this.props.revokedAt = new Date();
    this.props.updatedAt = new Date();
  }

  recordUsage(): void {
    this.props.lastUsedAt = new Date();
    this.props.updatedAt = new Date();
  }

  updateScopes(scopes: string[]): void {
    this.props.scopes = scopes;
    this.props.updatedAt = new Date();
  }

  updateRateLimit(rateLimit: number): void {
    this.props.rateLimit = rateLimit;
    this.props.updatedAt = new Date();
  }

  toPersistence(): ApiKeyProps {
    return { ...this.props };
  }
}
