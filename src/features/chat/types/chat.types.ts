// chat.types.ts
// Complete TypeScript definitions for chat feature following clean architecture

import { Request } from 'express';
import { AuthenticatedUser } from '../../auth/auth.types.js';
import { z } from 'zod';

// ==========================================
// CONFIGURATION TYPES
// ==========================================

export interface ChatConfig {
  model: string;
  maxLength: number;
  temperature: number;
  topP: number;
  doSample: boolean;
  returnFullText: boolean;
  timeout: number;
}

export interface ChatServiceConfig extends Partial<ChatConfig> {}

// ==========================================
// REQUEST/RESPONSE TYPES
// ==========================================

export interface ChatRequestBody {
  prompt: string;
}

export interface ChatResponse {
  answer: string;
  timestamp: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface ChatHealthResponse {
  success: boolean;
  message: string;
  model: string;
  timestamp: string;
  api_status: 'online' | 'offline';
}

export interface ChatConfigResponse {
  success: boolean;
  config: ChatConfig;
}

export interface ChatConfigUpdateResponse {
  success: boolean;
  message: string;
  config: ChatConfig;
}

// ==========================================
// API RESPONSE WRAPPERS
// ==========================================

export interface ChatApiSuccessResponse {
  success: true;
  data: ChatResponse;
}

export interface ChatApiErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export type ChatApiResponse = ChatApiSuccessResponse | ChatApiErrorResponse;

// ==========================================
// HUGGING FACE API TYPES
// ==========================================

export interface HuggingFaceRequest {
  inputs: string;
  parameters?: {
    max_length?: number;
    temperature?: number;
    top_p?: number;
    do_sample?: boolean;
    return_full_text?: boolean;
    repetition_penalty?: number;
    num_return_sequences?: number;
    pad_token_id?: number;
  };
  options?: {
    use_cache?: boolean;
    wait_for_model?: boolean;
  };
}

export interface HuggingFaceResponse {
  generated_text: string;
}

export interface HuggingFaceError {
  error: string;
  estimated_time?: number;
  warnings?: string[];
}

// ==========================================
// SERVICE LAYER TYPES
// ==========================================

export interface ChatServiceResponse {
  answer: string;
  model: string;
  timestamp: Date;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface ChatHealthStatus {
  api_status: 'online' | 'offline';
  model: string;
  last_check: string;
  response_time?: number;
}

// ==========================================
// ERROR TYPES
// ==========================================

export interface ChatError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

export enum ChatErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  MODEL_LOADING = 'MODEL_LOADING',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INVALID_API_KEY = 'INVALID_API_KEY',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

export const ChatRequestSchema = z.object({
  prompt: z.string()
    .min(5, 'Prompt must be at least 5 characters long')
    .max(2000, 'Prompt cannot exceed 2000 characters')
    .trim()
});

export const ChatConfigSchema = z.object({
  model: z.string().min(1, 'Model name is required').optional(),
  maxLength: z.number()
    .min(1, 'Max length must be at least 1')
    .max(4000, 'Max length cannot exceed 4000')
    .optional(),
  temperature: z.number()
    .min(0, 'Temperature must be between 0 and 2')
    .max(2, 'Temperature must be between 0 and 2')
    .optional(),
  topP: z.number()
    .min(0, 'Top P must be between 0 and 1')
    .max(1, 'Top P must be between 0 and 1')
    .optional(),
  doSample: z.boolean().optional(),
  returnFullText: z.boolean().optional(),
  timeout: z.number()
    .min(5000, 'Timeout must be at least 5 seconds')
    .max(120000, 'Timeout cannot exceed 2 minutes')
    .optional()
});

// ==========================================
// UTILITY TYPES
// ==========================================

export type ChatRequestValidation = z.infer<typeof ChatRequestSchema>;
export type ChatConfigValidation = z.infer<typeof ChatConfigSchema>;

// ==========================================
// MIDDLEWARE TYPES
// ==========================================

export interface AuthenticatedRequest extends Express.Request {
  user?: AuthenticatedUser;
}

// ==========================================
// CONSTANTS
// ==========================================

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  model: 'gpt2',
  maxLength: 150,
  temperature: 0.7,
  topP: 0.9,
  doSample: true,
  returnFullText: false,
  timeout: 30000
};

export const HUGGING_FACE_API_BASE_URL = 'https://api-inference.huggingface.co/models';

export const CHAT_ERROR_MESSAGES = {
  [ChatErrorCodes.VALIDATION_ERROR]: 'Invalid request data provided',
  [ChatErrorCodes.UNAUTHORIZED]: 'Authentication required to access this resource',
  [ChatErrorCodes.FORBIDDEN]: 'Insufficient permissions to access this resource',
  [ChatErrorCodes.NOT_FOUND]: 'Requested resource not found',
  [ChatErrorCodes.RATE_LIMIT_EXCEEDED]: 'API rate limit exceeded. Please try again later',
  [ChatErrorCodes.SERVICE_UNAVAILABLE]: 'Chat service is temporarily unavailable',
  [ChatErrorCodes.MODEL_LOADING]: 'AI model is currently loading. Please wait',
  [ChatErrorCodes.INTERNAL_ERROR]: 'An internal server error occurred',
  [ChatErrorCodes.INVALID_API_KEY]: 'Invalid or expired API key',
  [ChatErrorCodes.TIMEOUT_ERROR]: 'Request timeout exceeded',
  [ChatErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred'
} as const;

// ==========================================
// CORE CHAT TYPES
// ==========================================

export interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  timestamp: Date;
}

// ==========================================
// SERVICE LAYER TYPES
// ==========================================

export interface ChatServiceResponse {
  answer: string;
  model: string;
  timestamp: Date;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

// ==========================================
// REQUEST TYPES WITH AUTHENTICATION
// ==========================================

export interface AuthenticatedChatRequest extends Request {
  user: AuthenticatedUser;
  body: ChatRequestBody;
}

// ==========================================
// ANALYTICS AND MONITORING TYPES
// ==========================================

export interface ChatAnalytics {
  userId: string;
  prompt: string;
  response: string;
  model: string;
  responseTime: number;
  timestamp: Date;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface RateLimitInfo {
  userId: string;
  requestCount: number;
  resetTime: Date;
} 