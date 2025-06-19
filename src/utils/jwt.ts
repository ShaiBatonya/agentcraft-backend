import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/validateEnv.js';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface JWTOptions {
  expiresIn?: string;
}

/**
 * Sign a JWT token with user payload
 */
export const signToken = (payload: JWTPayload, options: JWTOptions = {}): string => {
  const { expiresIn = '1d' } = options;
  
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn,
    issuer: 'agentcraft',
    audience: 'agentcraft-users',
  } as any);
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'agentcraft',
      audience: 'agentcraft-users',
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Extract token from Authorization header
 */
export const extractBearerToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}; 