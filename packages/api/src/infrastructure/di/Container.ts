/**
 * Dependency Injection Container
 * Simple DI container for managing service dependencies
 */

import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IJobRepository } from "../../domain/repositories/IJobRepository";
import { IEventBus } from "../events/IEventBus";

import { UserRepository } from "../repositories/UserRepository";
import { JobRepository } from "../repositories/JobRepository";
import { EventBus } from "../events/EventBus";

import { UserService } from "../../application/services/UserService";
import { JobService } from "../../application/services/JobService";

export class Container {
  private static instance: Container;
  private services: Map<string, unknown> = new Map();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  private initializeServices(): void {
    // Infrastructure services
    const eventBus = new EventBus();
    this.register("eventBus", eventBus);

    // Repositories
    const userRepository = new UserRepository();
    this.register("userRepository", userRepository);

    const jobRepository = new JobRepository();
    this.register("jobRepository", jobRepository);

    // Application services
    const userService = new UserService(userRepository, eventBus);
    this.register("userService", userService);

    const jobService = new JobService(jobRepository, eventBus);
    this.register("jobService", jobService);
  }

  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }
    return service as T;
  }

  // Convenience getters
  getEventBus(): IEventBus {
    return this.get<IEventBus>("eventBus");
  }

  getUserRepository(): IUserRepository {
    return this.get<IUserRepository>("userRepository");
  }

  getJobRepository(): IJobRepository {
    return this.get<IJobRepository>("jobRepository");
  }

  getUserService(): UserService {
    return this.get<UserService>("userService");
  }

  getJobService(): JobService {
    return this.get<JobService>("jobService");
  }
}
