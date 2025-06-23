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
      res.redirect(`${env.CLIENT_URL}/oauth-debug?error=no_user_data`);
      return;
    }

    // Get full user data
    const user = await authService.findUserById(req.user.id);
    if (!user) {
      console.error('❌ OAuth Callback: User not found in database');
      res.redirect(`${env.CLIENT_URL}/oauth-debug?error=user_not_found`);
      return;
    }

    // Generate JWT token
    const token = authService.generateToken(user);
    
    // Set cookie options based on environment
    const cookieOptions = {
      httpOnly: true,
      secure: true, // Always use secure in production
      sameSite: 'none' as const, // Required for cross-site cookies
      path: '/',
      domain: env.NODE_ENV === 'production' ? '.onrender.com' : undefined, // Allow cookies across *.onrender.com subdomains in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Log cookie settings for debugging
    console.log('🍪 Setting cookie with options:', {
      ...cookieOptions,
      token: `${token.substring(0, 10)}...`,
      host: req.get('host'),
      origin: req.get('origin'),
      userAgent: req.get('user-agent')?.substring(0, 50) + '...'
    });

    // Set the cookie
    res.cookie('token', token, cookieOptions);
    
    // Also set CORS headers manually for cookie support
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.get('origin')) {
      res.header('Access-Control-Allow-Origin', req.get('origin'));
    }

    // Log success for debugging
    console.log('✅ OAuth Success:', {
      userId: user._id,
      email: user.email,
      cookieDomain: req.get('host'),
      redirectTo: `${env.CLIENT_URL}/oauth-debug?token=${token}`
    });

    // Redirect to frontend with token (for debugging)
    res.redirect(`${env.CLIENT_URL}/oauth-debug?token=${token}`);
  } catch (error: any) {
    console.error('❌ OAuth Callback Error:', error);
    const errorMessage = error?.message || 'Unknown error';
    res.redirect(`${env.CLIENT_URL}/oauth-debug?error=server_error&message=${encodeURIComponent(errorMessage)}`);
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
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined,
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
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