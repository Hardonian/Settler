/**
 * User Domain Entity Tests
 */

import { User, UserRole } from '../../domain/entities/User';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a new user with required fields', () => {
      const user = User.create({
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        role: UserRole.DEVELOPER,
        dataResidencyRegion: 'us',
        dataRetentionDays: 365,
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe(UserRole.DEVELOPER);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should generate a UUID for the user ID', () => {
      const user1 = User.create({
        email: 'user1@example.com',
        passwordHash: 'hash1',
        role: UserRole.DEVELOPER,
        dataResidencyRegion: 'us',
        dataRetentionDays: 365,
      });

      const user2 = User.create({
        email: 'user2@example.com',
        passwordHash: 'hash2',
        role: UserRole.DEVELOPER,
        dataResidencyRegion: 'us',
        dataRetentionDays: 365,
      });

      expect(user1.id).not.toBe(user2.id);
    });
  });

  describe('isDeleted', () => {
    it('should return false for active users', () => {
      const user = User.create({
        email: 'test@example.com',
        passwordHash: 'hash',
        role: UserRole.DEVELOPER,
        dataResidencyRegion: 'us',
        dataRetentionDays: 365,
      });

      expect(user.isDeleted()).toBe(false);
    });

    it('should return true for deleted users', () => {
      const user = User.create({
        email: 'test@example.com',
        passwordHash: 'hash',
        role: UserRole.DEVELOPER,
        dataResidencyRegion: 'us',
        dataRetentionDays: 365,
      });

      user.markAsDeleted();
      expect(user.isDeleted()).toBe(true);
    });
  });

  describe('scheduleDeletion', () => {
    it('should schedule deletion with grace period', () => {
      const user = User.create({
        email: 'test@example.com',
        passwordHash: 'hash',
        role: UserRole.DEVELOPER,
        dataResidencyRegion: 'us',
        dataRetentionDays: 365,
      });

      user.scheduleDeletion(30);
      expect(user.deletionScheduledAt).toBeDefined();
      expect(user.deletionScheduledAt!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('updatePassword', () => {
    it('should update password hash', () => {
      const user = User.create({
        email: 'test@example.com',
        passwordHash: 'old-hash',
        role: UserRole.DEVELOPER,
        dataResidencyRegion: 'us',
        dataRetentionDays: 365,
      });

      const originalUpdatedAt = user.updatedAt;
      
      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        user.updatePassword('new-hash');
        expect(user.passwordHash).toBe('new-hash');
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });
});
