import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { AuthService } from '../features/auth/auth.service.js';
import { env } from './validateEnv.js';
import { PassportUser } from '../features/auth/auth.types.js';

const authService = new AuthService();

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await authService.findUserById(id);
    if (user) {
      const authenticatedUser = authService.toAuthenticatedUser(user);
      done(null, authenticatedUser);
    } else {
      done(null, false);
    }
  } catch (error) {
    done(error, false);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Transform Google profile to our format
        const googleProfile = {
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails || [],
          photos: profile.photos || [],
          provider: 'google' as const,
        };

        // Find or create user
        const user = await authService.findOrCreateUser(googleProfile);
        const authenticatedUser = authService.toAuthenticatedUser(user);

        // Pass a simple object for passport serialization
        done(null, { id: authenticatedUser.id } as any);
      } catch (error) {
        console.error('Google OAuth error:', error);
        done(error, false);
      }
    }
  )
);

export default passport; 