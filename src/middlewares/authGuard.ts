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
    // Get token from cookie
    const token = req.cookies?.token;

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
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