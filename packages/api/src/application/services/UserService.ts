/**
 * User Service
 * Application service for user operations
 */

import { User, UserRole, UserProps } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { CreateUserCommand, CreateUserCommandResult } from "../commands/CreateUserCommand";
import { hashPassword } from "../../infrastructure/security/password";
import { UserCreatedEvent, UserDeletedEvent } from "../../domain/events/DomainEvent";
import { IEventBus } from "../../infrastructure/events/IEventBus";

export class UserService {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: IEventBus
  ) {}

  async createUser(command: CreateUserCommand): Promise<CreateUserCommandResult> {
    if (!command.tenantId) throw new Error("tenantId is required");

    // Check if user already exists within this tenant
    const existing = await this.userRepository.findByEmail(command.email, command.tenantId);
    if (existing) {
      throw new Error("User with this email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(command.password);

    // Create user entity
    const userProps: Omit<UserProps, "id" | "createdAt" | "updatedAt"> = {
      email: command.email,
      passwordHash,
      tenantId: command.tenantId,
      role: (command.role as UserRole) || UserRole.DEVELOPER,
      dataResidencyRegion: command.dataResidencyRegion || "us",
      dataRetentionDays: 365,
    };
    if (command.name !== undefined) {
      userProps.name = command.name;
    }
    const user = User.create(userProps);

    // Save user scoped to tenant
    const savedUser = await this.userRepository.save(user, command.tenantId);

    // Emit domain event
    await this.eventBus.publish(new UserCreatedEvent(savedUser.id, savedUser.email));

    return {
      userId: savedUser.id,
      email: savedUser.email,
    };
  }

  async getUserById(userId: string, tenantId: string): Promise<User | null> {
    if (!tenantId) throw new Error("tenantId is required");
    return this.userRepository.findById(userId, tenantId);
  }

  async getUserByEmail(email: string, tenantId: string): Promise<User | null> {
    if (!tenantId) throw new Error("tenantId is required");
    return this.userRepository.findByEmail(email, tenantId);
  }

  async deleteUser(userId: string, tenantId: string, password: string): Promise<void> {
    if (!tenantId) throw new Error("tenantId is required");
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify password
    const { verifyPassword } = await import("../../infrastructure/security/password");
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid password");
    }

    // Schedule deletion with 30-day grace period
    user.scheduleDeletion(30);
    await this.userRepository.save(user, tenantId);

    // Emit domain event
    await this.eventBus.publish(new UserDeletedEvent(userId));
  }

  async exportUserData(userId: string, tenantId: string): Promise<Record<string, unknown>> {
    if (!tenantId) throw new Error("tenantId is required");
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new Error("User not found");
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
