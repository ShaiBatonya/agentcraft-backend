// chat.routes.ts
// Express router for chat feature endpoints with authentication and middleware

import { Router } from 'express';
import { authGuard, adminGuard, optionalAuth } from '../../../middlewares/authGuard.js';
import { 
  chatHandler, 
  getChatConfig, 
  updateChatConfig, 
  chatHealthCheck,
  getAvailableModels,
  getChatAnalytics
} from '../controllers/chat.controller.js';

const router = Router();

// ==========================================
// MAIN CHAT ENDPOINTS
// ==========================================

/**
 * @openapi
 * /api/chat:
 *   post:
 *     tags:
 *       - Chat
 *     summary: Send message to AI chat service
 *     description: Send a message to the AI and receive a response. Requires authentication.
 *     security:
 *       - CookieAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The user's message to send to the AI
 *                 example: "Hello, how are you?"
 *               model:
 *                 type: string
 *                 description: AI model to use (optional)
 *                 example: "microsoft/DialoGPT-medium"
 *               context:
 *                 type: array
 *                 description: Previous conversation context (optional)
 *                 items:
 *                   $ref: '#/components/schemas/ChatMessage'
 *     responses:
 *       200:
 *         description: AI response received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 response:
 *                   type: string
 *                   description: AI's response message
 *                 model:
 *                   type: string
 *                   description: AI model used
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 usage:
 *                   type: object
 *                   description: Token usage information
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: AI service error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authGuard, chatHandler);

/**
 * @openapi
 * /api/chat/test:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Test chat service connectivity
 *     description: Simple test endpoint to verify chat service is running
 *     responses:
 *       200:
 *         description: Chat service is working
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     service:
 *                       type: string
 *                       example: "chat-api"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 */
router.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: "Chat working",
    timestamp: new Date().toISOString(),
    service: "chat-api",
    version: "1.0.0"
  });
});

// ==========================================
// CONFIGURATION ENDPOINTS (ADMIN ONLY)
// ==========================================

/**
 * @openapi
 * /api/chat/config:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get chat configuration (Admin only)
 *     description: Retrieve current chat service configuration settings
 *     security:
 *       - CookieAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 config:
 *                   type: object
 *                   properties:
 *                     model:
 *                       type: string
 *                     maxTokens:
 *                       type: number
 *                     temperature:
 *                       type: number
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *   put:
 *     tags:
 *       - Chat
 *     summary: Update chat configuration (Admin only)
 *     description: Update chat service configuration settings
 *     security:
 *       - CookieAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 description: AI model to use
 *               maxTokens:
 *                 type: number
 *                 description: Maximum tokens per response
 *               temperature:
 *                 type: number
 *                 description: AI response creativity (0-1)
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 *       400:
 *         description: Invalid configuration
 */
router.get('/config', adminGuard, getChatConfig);
router.put('/config', adminGuard, updateChatConfig);

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

/**
 * @openapi
 * /api/chat/health:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Chat service health check
 *     description: Check the health and status of the chat service and AI models
 *     responses:
 *       200:
 *         description: Chat service health information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 model:
 *                   type: string
 *                   description: Currently active AI model
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 api_status:
 *                   type: string
 *                   enum: [online, offline, degraded]
 *                 response_time:
 *                   type: number
 *                   description: Average response time in ms
 *       503:
 *         description: Chat service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/health', optionalAuth, chatHealthCheck);

/**
 * @openapi
 * /api/chat/models:
 *   get:
 *     tags:
 *       - Chat
 *     summary: List available AI models (Admin only)
 *     description: Get a list of all available AI models for chat service
 *     security:
 *       - CookieAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Available models retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 models:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "microsoft/DialoGPT-medium"
 *                       name:
 *                         type: string
 *                         example: "DialoGPT Medium"
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [available, loading, error]
 *                       parameters:
 *                         type: object
 *                         properties:
 *                           maxTokens:
 *                             type: number
 *                           temperature:
 *                             type: number
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/models', adminGuard, getAvailableModels);

/**
 * @openapi
 * /api/chat/analytics:
 *   get:
 *     tags:
 *       - Chat
 *     summary: Get chat usage analytics (Admin only)
 *     description: Retrieve detailed analytics about chat service usage
 *     security:
 *       - CookieAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: week
 *         description: Analytics time period
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics (ISO format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics (ISO format)
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     totalMessages:
 *                       type: number
 *                     totalUsers:
 *                       type: number
 *                     avgResponseTime:
 *                       type: number
 *                     modelUsage:
 *                       type: object
 *                     dailyStats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           messages:
 *                             type: number
 *                           users:
 *                             type: number
 *                 period:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
router.get('/analytics', adminGuard, getChatAnalytics);



// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

/**
 * Chat-specific error handler
 */
router.use((error: any, req: any, res: any, next: any) => {
  console.error('❌ Chat route error:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    success: false,
    error: 'An unexpected error occurred in the chat service',
    code: 'CHAT_ROUTE_ERROR',
    timestamp: new Date().toISOString(),
  });
});

export default router; 