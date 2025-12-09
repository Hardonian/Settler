/**
 * API Key Repository Interface
 * Defines the contract for API key data persistence
 */
import { ApiKey } from '../entities/ApiKey';
export interface IApiKeyRepository {
    findById(id: string): Promise<ApiKey | null>;
    findByKeyPrefix(keyPrefix: string): Promise<ApiKey | null>;
    findByUserId(userId: string, limit: number, offset: number): Promise<ApiKey[]>;
    save(apiKey: ApiKey): Promise<ApiKey>;
    delete(id: string): Promise<void>;
    countByUserId(userId: string): Promise<number>;
}
//# sourceMappingURL=IApiKeyRepository.d.ts.map