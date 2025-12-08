/**
 * User Service
 * Application service for user operations
 */

import { User, UserRole, UserProps } from '../../domain/entities/User';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { CreateUserCommand, CreateUserCommandResult } from '../commands/CreateUserCommand';
import { hashPassword } from '../../infrastructure/security/password';
import { UserCreatedEvent, UserDeletedEvent } from '../../domain/events/DomainEvent';
import { IEventBus } from '../../infrastructure/events/IEventBus';

export class UserService {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: IEventBus
  ) {}

  async createUser(command: CreateUserCommand): Promise<CreateUserCommandResult> {
    // Check if user already exists
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(command.password);

    // Create user entity
    const userProps: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'> = {
      email: command.email,
      passwordHash,
      tenantId: 'default', // TODO: Get from context
      role: (command.role as UserRole) || UserRole.DEVELOPER,
      dataResidencyRegion: command.dataResidencyRegion || 'us',
      dataRetentionDays: 365,
    };
    if (command.name !== undefined) {
      userProps.name = command.name;
    }
    const user = User.create(userProps);

    // Save user
    const savedUser = await this.userRepository.save(user);

    // Emit domain event
    await this.eventBus.publish(
      new UserCreatedEvent(savedUser.id, savedUser.email)
    );

    return {
      userId: savedUser.id,
      email: savedUser.email,
    };
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.userRepository.findById(userId);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async deleteUser(userId: string, password: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const { verifyPassword } = await import('../../infrastructure/security/password');
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Schedule deletion with 30-day grace period
    user.scheduleDeletion(30);
    await this.userRepository.save(user);

    // Emit domain event
    await this.eventBus.publish(new UserDeletedEvent(userId));
  }

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // In a real implementation, this would gather data from multiple repositories
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      exportedAt: new Date().toISOString(),
    };
  }
}

