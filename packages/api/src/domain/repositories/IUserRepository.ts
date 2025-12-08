/**
 * User Repository Interface
 * Defines the contract for user data persistence
 */

import { User } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(limit: number, offset: number): Promise<User[]>;
  count(): Promise<number>;
}
