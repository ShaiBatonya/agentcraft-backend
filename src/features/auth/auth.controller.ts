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
      res.redirect(`${env.CLIENT_URL}/?error=authentication_failed`);
      return;
    }

    // Get full user data
    const user = await authService.findUserById(req.user.id);
    if (!user) {
      res.redirect(`${env.CLIENT_URL}/?error=user_not_found`);
      return;
    }

    // Generate JWT token
    const token = authService.generateToken(user);

    // Set secure cookie
    const cookieOptions = authService.getCookieOptions();
    res.cookie('token', token, cookieOptions);

    // Redirect to frontend chat page
    res.redirect(`${env.CLIENT_URL}/chat`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${env.CLIENT_URL}/?error=server_error`);
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
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    res.json({
      success: true,
      user: req.user,
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
    // Clear cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
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
  });
}; 