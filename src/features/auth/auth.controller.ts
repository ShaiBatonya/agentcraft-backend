import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { env } from '../../config/validateEnv.js';

const authService = new AuthService();

/**
 * Handle Google OAuth callback and set JWT cookie
 */
export const handleGoogleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // User should be attached by Passport
    if (!req.user) {
      console.error('❌ OAuth Callback: No user data from Passport');
      res.redirect(`${env.CLIENT_URL}/auth/callback?error=no_user_data`);
      return;
    }

    // Get full user data
    const user = await authService.findUserById(req.user.id);
    if (!user) {
      console.error('❌ OAuth Callback: User not found in database');
      res.redirect(`${env.CLIENT_URL}/auth/callback?error=user_not_found`);
      return;
    }

    // Generate JWT token
    const token = authService.generateToken(user);
    
    // Set cookie options based on environment
    // NOTE: onrender.com is on Public Suffix List - cannot use domain: '.onrender.com'
    // Must set cookies for individual service domains in production
    const isProduction = env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // Only secure in production (HTTPS)
      sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' for cross-site in production, 'lax' for development
      path: '/',
      // No domain setting - let browser set it to current host (avoids PSL issues)
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Log cookie settings for debugging
    console.log('🍪 Setting cookie with options:', {
      ...cookieOptions,
      token: `${token.substring(0, 10)}...`,
      host: req.get('host'),
      origin: req.get('origin'),
      referer: req.get('referer'),
      forwardedHost: req.get('x-forwarded-host'),
      userAgent: req.get('user-agent')?.substring(0, 50) + '...'
    });

    // Set the cookie
    res.cookie('token', token, cookieOptions);
    
    // Also set CORS headers manually for cookie support
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.get('origin')) {
      res.header('Access-Control-Allow-Origin', req.get('origin'));
    }

    // Log success for debugging (without exposing token)
    console.log('✅ OAuth Success:', {
      userId: user._id,
      email: user.email,
      cookieDomain: req.get('host'),
      cookieSet: true,
      redirectTo: `${env.CLIENT_URL}/auth/callback?success=true`
    });

    // Redirect to frontend callback page (token is securely stored in HttpOnly cookie)
    res.redirect(`${env.CLIENT_URL}/auth/callback?success=true`);
  } catch (error: any) {
    console.error('❌ OAuth Callback Error:', error);
    const errorMessage = error?.message || 'Unknown error';
    res.redirect(`${env.CLIENT_URL}/auth/callback?error=server_error&message=${encodeURIComponent(errorMessage)}`);
  }
};

/**
 * Get current user info from JWT cookie
 */
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Log available cookies for debugging
    console.log('🔍 Available cookies:', req.cookies);
    console.log('🔍 Auth header:', req.headers.authorization);

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    console.log('🔍 Auth Controller: Request user ID:', req.user.id);
    
    // Get fresh user data and properly format it
    const user = await authService.findUserById(req.user.id);
    if (!user) {
      console.log('❌ Auth Controller: User not found in database');
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    console.log('✅ Auth Controller: Raw user from DB:', {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      googleId: user.googleId,
      avatar: user.avatar
    });

    // Transform user to proper format with all required fields
    const authenticatedUser = authService.toAuthenticatedUser(user);
    
    console.log('✅ Auth Controller: Transformed user:', authenticatedUser);

    res.json({
      success: true,
      data: authenticatedUser,
      message: 'User retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Logout user by clearing JWT cookie
 */
export const logout = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Clear cookie with same options as when setting
    const isProduction = env.NODE_ENV === 'production';
    res.clearCookie('token', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      // No domain setting - must match how cookie was originally set
    });

    console.log('✅ Logout successful: Cookie cleared');

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Health check for auth system
 */
export const authHealthCheck = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.json({
    success: true,
    message: 'Auth system is running',
    authenticated: !!req.user,
    cookies: req.cookies,
  });
}; 