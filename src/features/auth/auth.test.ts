import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from './auth.service.js';
import { User, IUser } from '../../models/User.js';
import { Document, Types } from 'mongoose';

describe('AuthService', () => {
  const authService = new AuthService();

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('findOrCreateUser', () => {
    it('should create a new user from Google profile', async () => {
      const googleProfile = {
        id: '123456789',
        displayName: 'Test User',
        emails: [{ value: 'test@example.com', verified: true }],
        photos: [{ value: 'https://example.com/photo.jpg' }],
        provider: 'google' as const
      };

      const user = (await authService.findOrCreateUser(googleProfile)) as IUser;

      expect(user).toBeDefined();
      expect(user.googleId).toBe(googleProfile.id);
      expect(user.email).toBe(googleProfile.emails[0].value);
      expect(user.name).toBe(googleProfile.displayName);
      expect(user.avatar).toBe(googleProfile.photos[0].value);
    });

    it('should return existing user if found by Google ID', async () => {
      const existingUser = new User({
        googleId: '123456789',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      });
      await existingUser.save();

      const googleProfile = {
        id: '123456789',
        displayName: 'Test User Updated',
        emails: [{ value: 'test@example.com', verified: true }],
        photos: [{ value: 'https://example.com/photo.jpg' }],
        provider: 'google' as const
      };

      const user = (await authService.findOrCreateUser(googleProfile)) as IUser & { _id: Types.ObjectId };

      expect(user._id.toString()).toBe(existingUser._id.toString());
      expect(user.googleId).toBe(existingUser.googleId);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const user = new User({
        _id: '507f1f77bcf86cd799439011',
        googleId: '123456789',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      });

      const token = authService.generateToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });
  });
}); 