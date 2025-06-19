import { Request } from 'express';
import { IUser } from '../../models/User.js';

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: Array<{ value: string; verified: boolean }>;
  photos: Array<{ value: string }>;
  provider: 'google';
}

export interface AuthenticatedUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  isAdmin: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthenticatedUser;
  message?: string;
}

export interface LoginResponse extends AuthResponse {
  token?: string;
}

// Passport user serialization
export interface PassportUser {
  id: string;
} 