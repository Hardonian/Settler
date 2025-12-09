"use strict";
/**
 * User Service
 * Application service for user operations
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const User_1 = require("../../domain/entities/User");
const password_1 = require("../../infrastructure/security/password");
const DomainEvent_1 = require("../../domain/events/DomainEvent");
class UserService {
    userRepository;
    eventBus;
    constructor(userRepository, eventBus) {
        this.userRepository = userRepository;
        this.eventBus = eventBus;
    }
    async createUser(command) {
        // Check if user already exists
        const existing = await this.userRepository.findByEmail(command.email);
        if (existing) {
            throw new Error('User with this email already exists');
        }
        // Hash password
        const passwordHash = await (0, password_1.hashPassword)(command.password);
        // Create user entity
        const userProps = {
            email: command.email,
            passwordHash,
            tenantId: 'default', // TODO: Get from context
            role: command.role || User_1.UserRole.DEVELOPER,
            dataResidencyRegion: command.dataResidencyRegion || 'us',
            dataRetentionDays: 365,
        };
        if (command.name !== undefined) {
            userProps.name = command.name;
        }
        const user = User_1.User.create(userProps);
        // Save user
        const savedUser = await this.userRepository.save(user);
        // Emit domain event
        await this.eventBus.publish(new DomainEvent_1.UserCreatedEvent(savedUser.id, savedUser.email));
        return {
            userId: savedUser.id,
            email: savedUser.email,
        };
    }
    async getUserById(userId) {
        return this.userRepository.findById(userId);
    }
    async getUserByEmail(email) {
        return this.userRepository.findByEmail(email);
    }
    async deleteUser(userId, password) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        // Verify password
        const { verifyPassword } = await Promise.resolve().then(() => __importStar(require('../../infrastructure/security/password')));
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid password');
        }
        // Schedule deletion with 30-day grace period
        user.scheduleDeletion(30);
        await this.userRepository.save(user);
        // Emit domain event
        await this.eventBus.publish(new DomainEvent_1.UserDeletedEvent(userId));
    }
    async exportUserData(userId) {
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
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map