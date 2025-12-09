/**
 * Dependency Injection Container
 * Simple DI container for managing service dependencies
 */
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IJobRepository } from '../../domain/repositories/IJobRepository';
import { IEventBus } from '../events/IEventBus';
import { UserService } from '../../application/services/UserService';
import { JobService } from '../../application/services/JobService';
export declare class Container {
    private static instance;
    private services;
    private constructor();
    static getInstance(): Container;
    private initializeServices;
    register<T>(name: string, service: T): void;
    get<T>(name: string): T;
    getEventBus(): IEventBus;
    getUserRepository(): IUserRepository;
    getJobRepository(): IJobRepository;
    getUserService(): UserService;
    getJobService(): JobService;
}
//# sourceMappingURL=Container.d.ts.map