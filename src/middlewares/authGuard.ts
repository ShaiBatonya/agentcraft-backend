import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';
import { AuthService } from '../features/auth/auth.service.js';

const authService = new AuthService();

/**
 * Middleware to authenticate user from JWT cookie
 */
export const authGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔍 AuthGuard: Checking authentication');
    console.log('🔍 AuthGuard: Available cookies:', req.cookies);
    console.log('🔍 AuthGuard: Raw cookie header:', req.headers.cookie);
    console.log('🔍 AuthGuard: Request origin:', req.get('origin'));
    console.log('🔍 AuthGuard: Request host:', req.get('host'));
    console.log('🔍 AuthGuard: User-Agent:', req.get('user-agent')?.substring(0, 50) + '...');
    
    // Get token from cookie
    const token = req.cookies?.token;

    if (!token) {
      console.log('❌ AuthGuard: No token found in cookies');
      console.log('❌ AuthGuard: All headers:', Object.keys(req.headers));
      res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
        debug: {
          cookiesReceived: Object.keys(req.cookies || {}),
          origin: req.get('origin'),
          host: req.get('host')
        }
      });
      return;
    }

    console.log('✅ AuthGuard: Token found, length:', token.length);

    // Verify token
    const decoded = verifyToken(token);
    console.log('✅ AuthGuard: Token decoded successfully:', { userId: decoded.userId, email: decoded.email });
    
    // Get user from database
    const user = await authService.validateUserSession(decoded.userId);
    
    if (!user) {
      console.log('❌ AuthGuard: User not found in validateUserSession');
      res.status(401).json({
        success: false,
        message: 'Access denied. User not found.',
      });
      return;
    }

    console.log('✅ AuthGuard: User validated successfully:', { id: user.id, email: user.email });

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    
    res.status(401).json({
      success: false,
      message: errorMessage,
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      next();
      return;
    }

    const decoded = verifyToken(token);
    const user = await authService.validateUserSession(decoded.userId);
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Admin role guard - requires user to be authenticated and have admin role
 */
export const adminGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookie
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await authService.validateUserSession(decoded.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not found.',
      });
      return;
    }

    // Check admin role
    if (user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Authorization failed';
    
    res.status(403).json({
      success: false,
      message: errorMessage,
    });
  }
}; 