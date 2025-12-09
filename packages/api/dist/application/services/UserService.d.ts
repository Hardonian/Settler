/**
 * User Service
 * Application service for user operations
 */
import { User } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { CreateUserCommand, CreateUserCommandResult } from '../commands/CreateUserCommand';
import { IEventBus } from '../../infrastructure/events/IEventBus';
export declare class UserService {
    private userRepository;
    private eventBus;
    constructor(userRepository: IUserRepository, eventBus: IEventBus);
    createUser(command: CreateUserCommand): Promise<CreateUserCommandResult>;
    getUserById(userId: string): Promise<User | null>;
    getUserByEmail(email: string): Promise<User | null>;
    deleteUser(userId: string, password: string): Promise<void>;
    exportUserData(userId: string): Promise<Record<string, unknown>>;
}
//# sourceMappingURL=UserService.d.ts.map