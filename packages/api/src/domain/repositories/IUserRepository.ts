/**
 * User Repository Interface
 * Defines the contract for user data persistence
 *
 * INVARIANT: All methods require tenantId to enforce tenant isolation.
 * No query may execute without a tenant scope.
 */

import { User } from "../entities/User";

export interface IUserRepository {
  findById(id: string, tenantId: string): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  save(user: User, tenantId: string): Promise<User>;
  delete(id: string, tenantId: string): Promise<void>;
  findAll(tenantId: string, limit: number, offset: number): Promise<User[]>;
  count(tenantId: string): Promise<number>;
}
