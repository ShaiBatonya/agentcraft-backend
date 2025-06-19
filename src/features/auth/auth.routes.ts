import { Router } from 'express';
import passport from '../../config/passport.js';
import { authGuard, optionalAuth } from '../../middlewares/authGuard.js';
import {
  handleGoogleCallback,
  getCurrentUser,
  logout,
  authHealthCheck,
} from './auth.controller.js';

const router = Router();

// ==========================================
// GOOGLE OAUTH ROUTES
// ==========================================

/**
 * @openapi
 * /api/auth/google:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Initiate Google OAuth authentication
 *     description: Redirects user to Google OAuth consent screen for authentication
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 *         headers:
 *           Location:
 *             description: Google OAuth URL
 *             schema:
 *               type: string
 *               example: "https://accounts.google.com/oauth/authorize?..."
 *       500:
 *         description: OAuth setup error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

/**
 * @openapi
 * /api/auth/google/callback:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Google OAuth callback handler
 *     description: Handles the callback from Google OAuth and sets authentication cookie
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: OAuth authorization code from Google
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: OAuth state parameter
 *     responses:
 *       302:
 *         description: OAuth callback redirect (success or failure)
 *         headers:
 *           Location:
 *             description: Client application URL (with or without error parameter)
 *             schema:
 *               type: string
 *               example: "http://localhost:5173?auth=success"
 *           Set-Cookie:
 *             description: JWT authentication cookie (only set on success)
 *             schema:
 *               type: string
 *               example: "token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure"
 *       400:
 *         description: Invalid OAuth callback
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/google/callback', 
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5174'}?error=oauth_failed`,
    session: false,
  }),
  handleGoogleCallback
);

// ==========================================
// USER ROUTES
// ==========================================

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user profile
 *     description: Returns the authenticated user's profile information
 *     security:
 *       - CookieAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 authenticated:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Authentication required - No valid token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authGuard, getCurrentUser);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Logout user
 *     description: Logs out the current user and clears authentication cookie
 *     security:
 *       - CookieAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logged out successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *         headers:
 *           Set-Cookie:
 *             description: Clears the authentication cookie
 *             schema:
 *               type: string
 *               example: "token=; Max-Age=0; HttpOnly"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', authGuard, logout);

// ==========================================
// UTILITY ROUTES
// ==========================================

/**
 * @openapi
 * /api/auth/health:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Authentication system health check
 *     description: Check the health and status of the authentication system
 *     responses:
 *       200:
 *         description: Authentication system status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Auth system is running"
 *                 authenticated:
 *                   type: boolean
 *                   description: Whether the current request is authenticated
 *                 services:
 *                   type: object
 *                   properties:
 *                     google_oauth:
 *                       type: string
 *                       enum: [configured, missing_config, error]
 *                     jwt:
 *                       type: string
 *                       enum: [operational, error]
 *                     database:
 *                       type: string
 *                       enum: [connected, disconnected]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Authentication service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/health', optionalAuth, authHealthCheck);

export default router; 