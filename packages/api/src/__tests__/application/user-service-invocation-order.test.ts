import type { DomainEvent } from "../../domain/events/DomainEvent";
import { User, UserRole } from "../../domain/entities/User";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import type { IEventBus } from "../../infrastructure/events/IEventBus";
import { UserService } from "../../application/services/UserService";

jest.mock("../../infrastructure/security/password", () => ({
  hashPassword: jest.fn(async (value: string) => `hashed:${value}`),
  verifyPassword: jest.fn(async () => true),
}));

function makeUser(): User {
  return User.fromPersistence({
    id: "user-1",
    tenantId: "tenant-1",
    email: "user@example.com",
    passwordHash: "hashed:secret",
    role: UserRole.DEVELOPER,
    dataResidencyRegion: "us",
    dataRetentionDays: 365,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-01T00:00:00.000Z"),
  });
}

function createService() {
  const userRepository: jest.Mocked<IUserRepository> = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  };

  const eventBus: jest.Mocked<IEventBus> = {
    publish: jest.fn<Promise<void>, [DomainEvent]>(async () => undefined),
    subscribe: jest.fn<void, [string, (event: DomainEvent) => Promise<void>]>(() => undefined),
  };

  return { service: new UserService(userRepository, eventBus), userRepository, eventBus };
}

describe("UserService tenant-sensitive invocation order", () => {
  it("uses tenantId in repository calls for create/get flows", async () => {
    const { service, userRepository } = createService();
    const user = makeUser();

    userRepository.findByEmail.mockResolvedValueOnce(null);
    userRepository.save.mockResolvedValueOnce(user);

    await service.createUser({
      tenantId: "tenant-1",
      email: "user@example.com",
      password: "secret",
      role: "developer",
    });

    expect(userRepository.findByEmail).toHaveBeenCalledWith("user@example.com", "tenant-1");
    expect(userRepository.save).toHaveBeenCalledWith(expect.any(User), "tenant-1");

    userRepository.findById.mockResolvedValueOnce(user);
    await service.getUserById("user-1", "tenant-1");
    expect(userRepository.findById).toHaveBeenCalledWith("user-1", "tenant-1");

    userRepository.findByEmail.mockResolvedValueOnce(user);
    await service.getUserByEmail("user@example.com", "tenant-1");
    expect(userRepository.findByEmail).toHaveBeenLastCalledWith("user@example.com", "tenant-1");
  });

  it("uses tenantId in delete/export flows", async () => {
    const { service, userRepository, eventBus } = createService();
    const user = makeUser();

    userRepository.findById.mockResolvedValue(user);
    userRepository.save.mockResolvedValue(user);

    await service.deleteUser("user-1", "tenant-1", "secret");
    expect(userRepository.findById).toHaveBeenCalledWith("user-1", "tenant-1");
    expect(userRepository.save).toHaveBeenCalledWith(expect.any(User), "tenant-1");
    expect(eventBus.publish).toHaveBeenCalledTimes(1);

    userRepository.findById.mockResolvedValue(user);
    await service.exportUserData("user-1", "tenant-1");
    expect(userRepository.findById).toHaveBeenLastCalledWith("user-1", "tenant-1");
  });
});
