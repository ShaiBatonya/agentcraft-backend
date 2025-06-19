import { User, IUser } from '../../models/User.js';
import { signToken, JWTPayload } from '../../utils/jwt.js';
import { AuthenticatedUser, GoogleProfile, CookieOptions } from './auth.types.js';
import { env } from '../../config/validateEnv.js';

export class AuthService {
  /**
   * Find user by Google ID
   */
  async findUserByGoogleId(googleId: string): Promise<IUser | null> {
    return await User.findOne({ googleId });
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: string): Promise<IUser | null> {
    return await User.findById(userId);
  }

  /**
   * Create a new user from Google profile
   */
  async createUserFromGoogleProfile(profile: GoogleProfile): Promise<IUser> {
    const email = profile.emails[0]?.value;
    if (!email) {
      throw new Error('No email found in Google profile');
    }

    const userData = {
      googleId: profile.id,
      email,
      name: profile.displayName,
      avatar: profile.photos[0]?.value || undefined,
      role: 'user' as const,
    };

    const user = new User(userData);
    return await user.save();
  }

  /**
   * Find or create user from Google profile
   */
  async findOrCreateUser(profile: GoogleProfile): Promise<IUser> {
    // First try to find by Google ID
    let user = await this.findUserByGoogleId(profile.id);
    
    if (user) {
      return user;
    }

    // If not found by Google ID, try by email
    const email = profile.emails[0]?.value;
    if (email) {
      user = await this.findUserByEmail(email);
      
      if (user) {
        // Update existing user with Google ID
        user.googleId = profile.id;
        user.avatar = profile.photos[0]?.value || user.avatar;
        return await user.save();
      }
    }

    // Create new user
    return await this.createUserFromGoogleProfile(profile);
  }

  /**
   * Generate JWT token for user
   */
  generateToken(user: IUser): string {
    const payload: JWTPayload = {
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    return signToken(payload);
  }

  /**
   * Convert IUser to AuthenticatedUser
   */
  toAuthenticatedUser(user: IUser): AuthenticatedUser {
    return {
      id: (user._id as any).toString(),
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      isAdmin: user.role === 'admin',
    };
  }

  /**
   * Get secure cookie options based on environment
   */
  getCookieOptions(): CookieOptions {
    const isProduction = env.NODE_ENV === 'production';
    
    return {
      httpOnly: true,
      secure: isProduction, // Only secure in production
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      path: '/',
    };
  }

  /**
   * Validate user session and return user data
   */
  async validateUserSession(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.findUserById(userId);
    if (!user) {
      return null;
    }
    
    return this.toAuthenticatedUser(user);
  }
} 