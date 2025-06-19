// chat.controller.ts
// Comprehensive HTTP request handlers for chat endpoints with validation and error handling

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ChatService, ChatServiceConfig, ChatHealthResponse } from '../services/chat.service.js';
import { 
  validateChatRequest, 
  validateChatConfig, 
  validateChatQuery,
  validateAdminChatConfig,
  sanitizePrompt 
} from '../validators/chat.validators.js';
import {
  type AuthenticatedRequest,
  type ChatApiSuccessResponse,
  type ChatApiErrorResponse,
  type ChatConfigResponse,
  type ChatConfigUpdateResponse,
  ChatErrorCodes,
  CHAT_ERROR_MESSAGES
} from '../types/chat.types.js';
import { env } from '../../../config/validateEnv.js';

// Initialize chat service
const chatService = new ChatService();

// ==========================================
// MAIN CHAT ENDPOINT
// ==========================================

/**
 * @swagger
 * /api/chat:
 *   post:
 *     tags: [Chat]
 *     summary: Generate AI chat response
 *     description: Sends a prompt to the AI model and returns a generated response
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 2000
 *                 description: The prompt to send to the AI model
 *                 example: "Tell me a joke about programmers"
 *     responses:
 *       200:
 *         description: Successful AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     answer:
 *                       type: string
 *                       description: The AI-generated response
 *                       example: "Why do programmers prefer dark mode? Because light attracts bugs!"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: When the response was generated
 *                     model:
 *                       type: string
 *                       description: The AI model used
 *                       example: "gpt2"
 *                     usage:
 *                       type: object
 *                       properties:
 *                         prompt_tokens:
 *                           type: number
 *                         completion_tokens:
 *                           type: number
 *                         total_tokens:
 *                           type: number
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Authentication required
 *       429:
 *         description: Rate limit exceeded
 *       503:
 *         description: Service unavailable
 */
export async function chatHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Validate request body
    const { prompt } = validateChatRequest(req.body);
    
    // Sanitize input
    const sanitizedPrompt = sanitizePrompt(prompt);
    
    // Get authenticated user
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      const errorResponse: ChatApiErrorResponse = {
        success: false,
        error: CHAT_ERROR_MESSAGES[ChatErrorCodes.UNAUTHORIZED],
        code: ChatErrorCodes.UNAUTHORIZED,
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Extract context from request body if provided
    const context = req.body.context || [];
    
    // Get AI response from service layer (now using Gemini)
    const serviceResponse = await chatService.getChatResponse(sanitizedPrompt, user.id, context);
    
    // Format success response as requested
    const response = {
      success: true,
      data: {
        reply: serviceResponse.answer,
      },
    };

    // Log successful request
    const responseTime = Date.now() - startTime;
    console.log(`✅ Chat request completed - User: ${user.id}, Model: ${serviceResponse.model}, Time: ${responseTime}ms`);

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Chat handler error:', error);
    
    const responseTime = Date.now() - startTime;
    console.log(`❌ Chat request failed - Time: ${responseTime}ms, Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const errorResponse: ChatApiErrorResponse = {
        success: false,
        error: CHAT_ERROR_MESSAGES[ChatErrorCodes.VALIDATION_ERROR],
        code: ChatErrorCodes.VALIDATION_ERROR,
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
      res.status(400).json(errorResponse);
      return;
    }

    // Handle service-specific errors
    if (error instanceof Error) {
      let statusCode = 500;
      let errorCode = ChatErrorCodes.INTERNAL_ERROR;

      // Map specific errors to appropriate status codes
      if (error.message.includes('at least 5 characters') || error.message.includes('Validation failed')) {
        statusCode = 400;
        errorCode = ChatErrorCodes.VALIDATION_ERROR;
      } else if (error.message.includes('Invalid Hugging Face API key') || error.message.includes('API key')) {
        statusCode = 503;
        errorCode = ChatErrorCodes.INVALID_API_KEY;
      } else if (error.message.includes('Rate limit exceeded')) {
        statusCode = 429;
        errorCode = ChatErrorCodes.RATE_LIMIT_EXCEEDED;
      } else if (error.message.includes('Model unavailable')) {
        statusCode = 503;
        errorCode = ChatErrorCodes.MODEL_LOADING;
      } else if (error.message.includes('Service temporarily unavailable') || error.message.includes('timeout')) {
        statusCode = 503;
        errorCode = ChatErrorCodes.SERVICE_UNAVAILABLE;
      }

      // Use the requested error format for model unavailable
      const errorResponse = error.message.includes('Model unavailable') 
        ? {
            success: false,
            error: 'Model unavailable. Please try again later.'
          }
        : {
            success: false,
            error: error.message,
            code: errorCode,
          };
      
      res.status(statusCode).json(errorResponse);
      return;
    }

    // Handle unknown errors
    const errorResponse: ChatApiErrorResponse = {
      success: false,
      error: CHAT_ERROR_MESSAGES[ChatErrorCodes.UNKNOWN_ERROR],
      code: ChatErrorCodes.UNKNOWN_ERROR,
    };
    
    res.status(500).json(errorResponse);
  }
}

// ==========================================
// CONFIGURATION ENDPOINTS
// ==========================================

/**
 * @swagger
 * /api/chat/config:
 *   get:
 *     tags: [Chat Admin]
 *     summary: Get current chat configuration
 *     description: Retrieves the current chat service configuration (Admin only)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 config:
 *                   type: object
 *                   properties:
 *                     model:
 *                       type: string
 *                       example: "gpt2"
 *                     maxLength:
 *                       type: number
 *                       example: 150
 *                     temperature:
 *                       type: number
 *                       example: 0.7
 *                     topP:
 *                       type: number
 *                       example: 0.9
 *                     doSample:
 *                       type: boolean
 *                       example: true
 *                     returnFullText:
 *                       type: boolean
 *                       example: false
 *                     timeout:
 *                       type: number
 *                       example: 30000
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
export async function getChatConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      const errorResponse: ChatApiErrorResponse = {
        success: false,
        error: CHAT_ERROR_MESSAGES[ChatErrorCodes.UNAUTHORIZED],
        code: ChatErrorCodes.UNAUTHORIZED,
      };
      res.status(401).json(errorResponse);
      return;
    }

    if (!user.isAdmin) {
      const errorResponse: ChatApiErrorResponse = {
        success: false,
        error: CHAT_ERROR_MESSAGES[ChatErrorCodes.FORBIDDEN],
        code: ChatErrorCodes.FORBIDDEN,
      };
      res.status(403).json(errorResponse);
      return;
    }

    const config = chatService.getConfig();
    
    const response = {
      success: true,
      config,
    };

    console.log(`✅ Config retrieved by admin user: ${user.id}`);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Get config error:', error);
    next(error);
  }
}

/**
 * @swagger
 * /api/chat/config:
 *   put:
 *     tags: [Chat Admin]
 *     summary: Update chat configuration
 *     description: Updates the chat service configuration (Admin only)
 *     security:
 *       - cookieAuth: []
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
 *                 example: "gpt2"
 *               maxLength:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 4000
 *                 description: Maximum response length
 *                 example: 200
 *               temperature:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 2
 *                 description: Creativity level (0-2)
 *                 example: 0.8
 *               topP:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 1
 *                 description: Nucleus sampling parameter
 *                 example: 0.9
 *               doSample:
 *                 type: boolean
 *                 description: Whether to use sampling
 *                 example: true
 *               returnFullText:
 *                 type: boolean
 *                 description: Return full text including prompt
 *                 example: false
 *               timeout:
 *                 type: number
 *                 minimum: 5000
 *                 maximum: 120000
 *                 description: Request timeout in milliseconds
 *                 example: 30000
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       400:
 *         description: Invalid configuration data
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Admin access required
 */
export async function updateChatConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      const errorResponse: ChatApiErrorResponse = {
        success: false,
        error: CHAT_ERROR_MESSAGES[ChatErrorCodes.UNAUTHORIZED],
        code: ChatErrorCodes.UNAUTHORIZED,
      };
      res.status(401).json(errorResponse);
      return;
    }

    if (!user.isAdmin) {
      const errorResponse: ChatApiErrorResponse = {
        success: false,
        error: CHAT_ERROR_MESSAGES[ChatErrorCodes.FORBIDDEN],
        code: ChatErrorCodes.FORBIDDEN,
      };
      res.status(403).json(errorResponse);
      return;
    }

    // Validate configuration update
    const validatedConfig = validateAdminChatConfig(req.body);
    
    // Update configuration
    chatService.updateConfig(validatedConfig);
    
    const response = {
      success: true,
      message: 'Configuration updated successfully',
      config: chatService.getConfig(),
    };

    console.log(`✅ Config updated by admin user: ${user.id}`, validatedConfig);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Update config error:', error);
    
    if (error instanceof Error && error.message.includes('validation failed')) {
      const errorResponse: ChatApiErrorResponse = {
        success: false,
        error: error.message,
        code: ChatErrorCodes.VALIDATION_ERROR,
      };
      res.status(400).json(errorResponse);
      return;
    }
    
    next(error);
  }
}

// ==========================================
// HEALTH CHECK ENDPOINT
// ==========================================

/**
 * @swagger
 * /api/chat/health:
 *   get:
 *     tags: [Chat]
 *     summary: Check chat service health
 *     description: Returns the health status of the chat service and AI model availability
 *     responses:
 *       200:
 *         description: Service is healthy
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
 *                   example: "Chat service is healthy"
 *                 model:
 *                   type: string
 *                   example: "gpt2"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 api_status:
 *                   type: string
 *                   enum: [online, offline]
 *                   example: "online"
 *       503:
 *         description: Service is unhealthy
 */
export async function chatHealthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const startTime = Date.now();
    
    // Use Gemini health check
    const healthStatus = await chatService.checkHealth();
    const responseTime = Date.now() - startTime;
    
    const response = {
      success: healthStatus.api_status === 'online',
      message: healthStatus.api_status === 'online' ? 'Chat service is healthy' : 'Chat service has issues',
      model: healthStatus.model,
      timestamp: healthStatus.last_check,
      api_status: healthStatus.api_status,
      response_time: responseTime,
      error: healthStatus.error,
    };

    // Log health check results
    console.log(`🔍 Gemini health check completed - Status: ${healthStatus.api_status}, Model: ${healthStatus.model}, Time: ${responseTime}ms`);
    
    if (healthStatus.error) {
      console.log('⚠️  Health check error:', healthStatus.error);
    }

    const statusCode = healthStatus.api_status === 'online' ? 200 : 503;
    res.status(statusCode).json(response);

  } catch (error) {
    console.error('❌ Health check error:', error);
    
    const response = {
      success: false,
      message: 'Health check failed - unable to run diagnostics',
      model: 'unknown',
      timestamp: new Date().toISOString(),
      api_status: 'offline',
    };
    
    res.status(503).json(response);
  }
}

// ==========================================
// CHAT HISTORY ENDPOINT
// ==========================================

/**
 * @swagger
 * /api/chat/history:
 *   get:
 *     tags: [Chat]
 *     summary: Get chat history for authenticated user
 *     description: Retrieves chat history for the authenticated user with optional filtering and pagination
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of messages to return
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Return messages before this timestamp (ISO 8601)
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Return messages after this timestamp (ISO 8601)
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID (admin only)
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           role:
 *                             type: string
 *                             enum: [user, assistant]
 *                           content:
 *                             type: string
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                           userId:
 *                             type: string
 *                             format: uuid
 *                     total:
 *                       type: integer
 *                       description: Total number of messages for this user
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more messages available
 *       401:
 *         description: Authentication required
 *       400:
 *         description: Invalid query parameters
 */
export async function getChatHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user) {
      const errorResponse: ChatApiErrorResponse = {
        success: false,
        error: CHAT_ERROR_MESSAGES[ChatErrorCodes.UNAUTHORIZED],
        code: ChatErrorCodes.UNAUTHORIZED,
      };
      res.status(401).json(errorResponse);
      return;
    }

    // Parse query parameters
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const before = req.query.before ? new Date(req.query.before as string) : undefined;
    const after = req.query.after ? new Date(req.query.after as string) : undefined;
    const requestedUserId = req.query.userId as string;

    // Only allow admins to query other users' history
    const targetUserId = user.isAdmin && requestedUserId ? requestedUserId : user.id;

    console.log(`🔄 Chat history request - User: ${user.id}, Target: ${targetUserId}, Limit: ${limit}`);

    // TODO: Implement actual database persistence for chat history
    // For now, return empty history to prevent frontend 404 errors
    // In a full implementation, this would query a ChatMessage model/table
    
    const response = {
      success: true,
      data: {
        messages: [],
        total: 0,
        hasMore: false,
      },
    };

    console.log(`✅ Chat history retrieved - User: ${user.id}, Messages: 0 (placeholder)`);
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Get chat history error:', error);
    
    if (error instanceof Error && error.message.includes('Invalid date')) {
      const errorResponse: ChatApiErrorResponse = {
        success: false,
        error: 'Invalid date format in query parameters',
        code: ChatErrorCodes.VALIDATION_ERROR,
      };
      res.status(400).json(errorResponse);
      return;
    }
    
    next(error);
  }
}

// ==========================================
// UTILITY ENDPOINTS
// ==========================================

/**
 * @swagger
 * /api/chat/models:
 *   get:
 *     tags: [Chat Admin]
 *     summary: List available AI models
 *     description: Returns a list of available AI models (Admin only)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Available models
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 models:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 */
export async function getAvailableModels(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user?.isAdmin) {
      const errorResponse: ChatApiErrorResponse = {
        success: false,
        error: CHAT_ERROR_MESSAGES[ChatErrorCodes.FORBIDDEN],
        code: ChatErrorCodes.FORBIDDEN,
      };
      res.status(403).json(errorResponse);
      return;
    }

    // Get available Gemini models from the chat service
    const availableModels = chatService.getAvailableModels().map(model => ({
      name: model.id,
      description: model.description,
      status: 'available',
      provider: 'Google Gemini'
    }));

    res.status(200).json({
      success: true,
      models: availableModels,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Get models error:', error);
    next(error);
  }
}

// ==========================================
// ANALYTICS ENDPOINT
// ==========================================

/**
 * @swagger
 * /api/chat/analytics:
 *   get:
 *     tags: [Chat Admin]
 *     summary: Get chat analytics
 *     description: Returns usage analytics for the chat service (Admin only)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Chat analytics data
 */
export async function getChatAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    
    if (!user?.isAdmin) {
      const errorResponse: ChatApiErrorResponse = {
        success: false,
        error: CHAT_ERROR_MESSAGES[ChatErrorCodes.FORBIDDEN],
        code: ChatErrorCodes.FORBIDDEN,
      };
      res.status(403).json(errorResponse);
      return;
    }

    // This would typically query analytics from database
    const analytics = {
      totalRequests: 0, // Would be fetched from database
      totalUsers: 0,
      averageResponseTime: 0,
      modelUsage: {},
      errorRate: 0,
      period: '24h',
    };

    res.status(200).json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Get analytics error:', error);
    next(error);
  }
} 