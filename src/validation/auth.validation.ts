import { z } from 'zod';

// JWT token validation
export const tokenSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// User role validation
export const userRoleSchema = z.enum(['user', 'admin']);

// Google profile validation (for internal use)
export const googleProfileSchema = z.object({
  id: z.string().min(1, 'Google ID is required'),
  displayName: z.string().min(1, 'Display name is required'),
  emails: z.array(
    z.object({
      value: z.string().email('Invalid email format'),
      verified: z.boolean().optional(),
    })
  ).min(1, 'At least one email is required'),
  photos: z.array(
    z.object({
      value: z.string().url('Invalid photo URL'),
    })
  ).optional(),
  provider: z.literal('google'),
});

// User creation validation
export const createUserSchema = z.object({
  googleId: z.string().min(1, 'Google ID is required'),
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  avatar: z.string().url('Invalid avatar URL').optional(),
  role: userRoleSchema.default('user'),
});

// Cookie validation
export const cookieOptionsSchema = z.object({
  httpOnly: z.boolean(),
  secure: z.boolean(),
  sameSite: z.enum(['strict', 'lax', 'none']),
  maxAge: z.number().positive(),
  path: z.string(),
});

// Auth response validation
export const authResponseSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.string(),
    googleId: z.string(),
    email: z.string().email(),
    name: z.string(),
    avatar: z.string().optional(),
    role: userRoleSchema,
  }).optional(),
  message: z.string().optional(),
});

// Environment variables validation (for auth-specific vars)
export const authEnvSchema = z.object({
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'Google Client ID is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google Client Secret is required'),
  CLIENT_URL: z.string().url('Client URL must be valid'),
});

// Request body validation helpers
export const validateToken = (data: unknown) => tokenSchema.parse(data);
export const validateGoogleProfile = (data: unknown) => googleProfileSchema.parse(data);
export const validateCreateUser = (data: unknown) => createUserSchema.parse(data);
export const validateAuthResponse = (data: unknown) => authResponseSchema.parse(data); 