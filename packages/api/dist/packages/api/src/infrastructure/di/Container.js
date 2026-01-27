"use strict";
/**
 * Dependency Injection Container
 * Simple DI container for managing service dependencies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Container = void 0;
const UserRepository_1 = require("../repositories/UserRepository");
const JobRepository_1 = require("../repositories/JobRepository");
const EventBus_1 = require("../events/EventBus");
const UserService_1 = require("../../application/services/UserService");
const JobService_1 = require("../../application/services/JobService");
class Container {
    static instance;
    services = new Map();
    constructor() {
        this.initializeServices();
    }
    static getInstance() {
        if (!Container.instance) {
            Container.instance = new Container();
        }
        return Container.instance;
    }
    initializeServices() {
        // Infrastructure services
        const eventBus = new EventBus_1.EventBus();
        this.register('eventBus', eventBus);
        // Repositories
        const userRepository = new UserRepository_1.UserRepository();
        this.register('userRepository', userRepository);
        const jobRepository = new JobRepository_1.JobRepository();
        this.register('jobRepository', jobRepository);
        // Application services
        const userService = new UserService_1.UserService(userRepository, eventBus);
        this.register('userService', userService);
        const jobService = new JobService_1.JobService(jobRepository, eventBus);
        this.register('jobService', jobService);
    }
    register(name, service) {
        this.services.set(name, service);
    }
    get(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not found`);
        }
        return service;
    }
    // Convenience getters
    getEventBus() {
        return this.get('eventBus');
    }
    getUserRepository() {
        return this.get('userRepository');
    }
    getJobRepository() {
        return this.get('jobRepository');
    }
    getUserService() {
        return this.get('userService');
    }
    getJobService() {
        return this.get('jobService');
    }
}
exports.Container = Container;
//# sourceMappingURL=Container.js.map