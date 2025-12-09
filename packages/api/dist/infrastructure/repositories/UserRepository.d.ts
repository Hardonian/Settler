/**
 * User Repository Implementation
 * PostgreSQL implementation of IUserRepository
 */
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
export declare class UserRepository implements IUserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    save(user: User): Promise<User>;
    delete(id: string): Promise<void>;
    findAll(limit: number, offset: number): Promise<User[]>;
    count(): Promise<number>;
    private mapRowToProps;
}
//# sourceMappingURL=UserRepository.d.ts.map