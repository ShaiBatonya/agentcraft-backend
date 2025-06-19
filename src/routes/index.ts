// routes/index.ts
// Central router index file to register all feature routers

import { Router, Request, Response } from 'express';
import chatRouter from '../features/chat/routes/chat.routes.js';
import authRouter from '../features/auth/auth.routes.js';

const router = Router();

// ==========================================
// API HEALTH CHECK
// ==========================================

/**
 * @openapi
 * /api:
 *   get:
 *     tags:
 *       - System
 *     summary: API health check and overview
 *     description: Returns API status, available endpoints, and service information
 *     responses:
 *       200:
 *         description: API is running successfully
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
 *                   example: "API is running successfully"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: "development"
 *                 features:
 *                   type: object
 *                   properties:
 *                     auth:
 *                       type: boolean
 *                     chat:
 *                       type: boolean
 *                 endpoints:
 *                   type: object
 *                   description: Available API endpoints
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API is running successfully',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      auth: true,
      chat: true,
    },
    endpoints: {
      auth: {
        login: '/api/auth/google',
        callback: '/api/auth/google/callback',
        logout: '/api/auth/logout',
        profile: '/api/auth/me',
      },
      chat: {
        chat: 'POST /api/chat',
        health: 'GET /api/chat/health',
        config: 'GET/PUT /api/chat/config (admin)',
        models: 'GET /api/chat/models (admin)',
        analytics: 'GET /api/chat/analytics (admin)',
      },
    },
  });
});

// ==========================================
// FEATURE ROUTERS REGISTRATION
// ==========================================

/**
 * Authentication Routes
 * Handles user authentication, OAuth, JWT tokens
 * Base path: /api/auth
 */
router.use('/auth', authRouter);

/**
 * Chat Routes
 * Handles AI chat functionality, configuration, and analytics
 * Base path: /api/chat
 */
router.use('/chat', chatRouter);

// ==========================================
// SYSTEM STATUS ROUTES
// ==========================================

/**
 * @openapi
 * /api/status:
 *   get:
 *     tags:
 *       - System
 *     summary: System status and health information
 *     description: Returns detailed system health, performance metrics, and service status
 *     responses:
 *       200:
 *         description: System status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: "connected"
 *                     huggingface:
 *                       type: string
 *                       example: "unknown"
 *                     auth:
 *                       type: string
 *                       example: "operational"
 *                     chat:
 *                       type: string
 *                       example: "operational"
 *                 performance:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       description: "Server uptime in seconds"
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: number
 *                           description: "Memory used in MB"
 *                         total:
 *                           type: number
 *                           description: "Total memory in MB"
 *                 version:
 *                   type: object
 *                   properties:
 *                     node:
 *                       type: string
 *                     api:
 *                       type: string
 *       503:
 *         description: Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        huggingface: 'unknown',
        auth: 'operational',
        chat: 'operational',
      },
      performance: {
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
      },
      version: {
        node: process.version,
        api: '1.0.0',
      },
    };

    res.status(200).json(status);
  } catch (error) {
    console.error('Status check error:', error);
    res.status(503).json({
      success: false,
      error: 'Unable to retrieve system status',
      timestamp: new Date().toISOString(),
    });
  }
});

// ==========================================
// DEBUG ROUTES
// ==========================================

/**
 * @openapi
 * /api/debug/routes:
 *   get:
 *     tags:
 *       - System
 *     summary: List all available API routes
 *     description: Debug endpoint that returns a complete list of all registered API routes
 *     responses:
 *       200:
 *         description: Routes list retrieved successfully
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
 *                   example: "Available API routes"
 *                 routes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["GET /api", "POST /api/chat", "GET /api/auth/me"]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 total_routes:
 *                   type: number
 *                   example: 15
 */
router.get('/debug/routes', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Available API routes",
    routes: [
      "GET /api",
      "GET /api/status",
      "GET /api/docs",
      "GET /api/debug/routes",
      "GET /api/chat/test",
      "POST /api/chat",
      "GET /api/chat/health",
      "GET /api/chat/config (admin)",
      "PUT /api/chat/config (admin)",
      "GET /api/chat/models (admin)",
      "GET /api/chat/analytics (admin)",
      "GET /api/auth/google",
      "GET /api/auth/google/callback",
      "GET /api/auth/me",
      "POST /api/auth/logout",
      "GET /api/auth/health"
    ],
    timestamp: new Date().toISOString(),
    total_routes: 15
  });
});

// ==========================================
// DOCUMENTATION ROUTES
// ==========================================

/**
 * @openapi
 * /api/docs:
 *   get:
 *     tags:
 *       - System
 *     summary: API documentation metadata
 *     description: Returns information about available API documentation and endpoints
 *     responses:
 *       200:
 *         description: Documentation information retrieved successfully
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
 *                   example: "API Documentation"
 *                 links:
 *                   type: object
 *                   properties:
 *                     swagger:
 *                       type: string
 *                       example: "/api/docs/swagger"
 *                     postman:
 *                       type: string
 *                       example: "/api/docs/postman"
 *                     openapi:
 *                       type: string
 *                       example: "/api/docs/openapi.json"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     public:
 *                       type: number
 *                     authenticated:
 *                       type: number
 *                     admin:
 *                       type: number
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 */
router.get('/docs', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'API Documentation',
    links: {
      swagger: '/api/docs/swagger',
      postman: '/api/docs/postman',
      openapi: '/api/docs/openapi.json',
    },
    endpoints: {
      total: 10,
      public: 2,
      authenticated: 4,
      admin: 4,
    },
    lastUpdated: new Date().toISOString(),
  });
});

// Error handling will be done at app level

export default router; 