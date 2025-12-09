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
export declare class ApiKey {
    private props;
    private constructor();
    static create(props: Omit<ApiKeyProps, 'id' | 'createdAt' | 'updatedAt'>): ApiKey;
    static fromPersistence(props: ApiKeyProps): ApiKey;
    get id(): string;
    get userId(): string;
    get keyPrefix(): string;
    get keyHash(): string;
    get name(): string | undefined;
    get scopes(): string[];
    get rateLimit(): number;
    get ipWhitelist(): string[] | undefined;
    get revokedAt(): Date | undefined;
    get expiresAt(): Date | undefined;
    get lastUsedAt(): Date | undefined;
    get createdAt(): Date;
    get updatedAt(): Date;
    isRevoked(): boolean;
    isExpired(): boolean;
    isValid(): boolean;
    hasScope(scope: string): boolean;
    isIpAllowed(ip: string): boolean;
    revoke(): void;
    recordUsage(): void;
    updateScopes(scopes: string[]): void;
    updateRateLimit(rateLimit: number): void;
    toPersistence(): ApiKeyProps;
}
//# sourceMappingURL=ApiKey.d.ts.map