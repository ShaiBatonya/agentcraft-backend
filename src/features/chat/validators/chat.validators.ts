// chat.validators.ts
// Comprehensive Zod validation schemas for chat feature

import { z } from 'zod';
import { 
  ChatRequestSchema, 
  ChatConfigSchema,
  type ChatRequestValidation,
  type ChatConfigValidation 
} from '../types/chat.types.js';

// ==========================================
// REQUEST VALIDATION FUNCTIONS
// ==========================================

/**
 * Validates chat request body with detailed error messages
 * @param body - Raw request body
 * @returns Validated chat request data
 * @throws ZodError with detailed field errors
 */
export function validateChatRequest(body: unknown): ChatRequestValidation {
  try {
    return ChatRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Validates chat configuration update request
 * @param body - Raw configuration update body
 * @returns Validated configuration data
 * @throws ZodError with detailed field errors
 */
export function validateChatConfig(body: unknown): ChatConfigValidation {
  try {
    return ChatConfigSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Configuration validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

// ==========================================
// HUGGING FACE API VALIDATION
// ==========================================

/**
 * Validates Hugging Face API response structure
 * @param data - Raw API response data
 * @returns Validated response data
 */
export const HuggingFaceResponseSchema = z.array(
  z.object({
    generated_text: z.string().min(1, 'Generated text cannot be empty'),
  })
).min(1, 'Response must contain at least one result');

export function validateHuggingFaceResponse(data: unknown): z.infer<typeof HuggingFaceResponseSchema> {
  try {
    return HuggingFaceResponseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid Hugging Face API response: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

// ==========================================
// ENVIRONMENT VALIDATION
// ==========================================

/**
 * Validates chat-related environment variables
 */
export const ChatEnvSchema = z.object({
  HF_API_KEY: z.string().min(1, 'HF_API_KEY is required for Hugging Face API access'),
  PORT: z.string().min(1, 'PORT is required'),
  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export function validateChatEnvironment(env: unknown): z.infer<typeof ChatEnvSchema> {
  try {
    return ChatEnvSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Chat environment validation failed:', error.errors);
      throw new Error('Invalid environment configuration for chat feature');
    }
    throw error;
  }
}

// ==========================================
// QUERY PARAMETER VALIDATION
// ==========================================

/**
 * Validates query parameters for chat endpoints
 */
export const ChatQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 0, 'Offset must be non-negative').optional(),
  model: z.string().min(1).optional(),
  format: z.enum(['json', 'text']).default('json').optional(),
});

export function validateChatQuery(query: unknown): z.infer<typeof ChatQuerySchema> {
  try {
    return ChatQuerySchema.parse(query);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Query parameter validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

// ==========================================
// ADMIN CONFIGURATION VALIDATION
// ==========================================

/**
 * Extended configuration schema for admin operations
 */
export const AdminChatConfigSchema = ChatConfigSchema.extend({
  enabled: z.boolean().optional(),
  maxRequestsPerHour: z.number().min(1).max(10000).optional(),
  allowedModels: z.array(z.string()).optional(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional(),
});

export function validateAdminChatConfig(body: unknown): z.infer<typeof AdminChatConfigSchema> {
  try {
    return AdminChatConfigSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Admin configuration validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

// ==========================================
// BATCH REQUEST VALIDATION
// ==========================================

/**
 * Validates batch chat requests for potential future use
 */
export const BatchChatRequestSchema = z.object({
  requests: z.array(ChatRequestSchema).min(1, 'At least one request is required').max(10, 'Maximum 10 requests allowed'),
  options: z.object({
    parallel: z.boolean().default(false),
    timeout: z.number().min(5000).max(300000).default(30000),
  }).optional(),
});

export function validateBatchChatRequest(body: unknown): z.infer<typeof BatchChatRequestSchema> {
  try {
    return BatchChatRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Batch request validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
}

// ==========================================
// SAFETY AND CONTENT VALIDATION
// ==========================================

/**
 * Content safety validation (basic implementation)
 */
export function validateContentSafety(prompt: string): { safe: boolean; reasons?: string[] } {
  const unsafe_patterns = [
    /\b(hate|violence|harm|dangerous|illegal)\b/i,
    /\b(suicide|self-harm|depression)\b/i,
    /\b(explicit|sexual|adult)\b/i,
  ];

  const reasons: string[] = [];
  
  for (const pattern of unsafe_patterns) {
    if (pattern.test(prompt)) {
      reasons.push(`Content contains potentially unsafe language: ${pattern.source}`);
    }
  }

  return {
    safe: reasons.length === 0,
    reasons: reasons.length > 0 ? reasons : undefined,
  };
}

// ==========================================
// UTILITY VALIDATION FUNCTIONS
// ==========================================

/**
 * Validates if a string is a valid model name format
 */
export function isValidModelName(model: string): boolean {
  // Model names typically follow: organization/model-name or just model-name
  const modelNameRegex = /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?$/;
  return modelNameRegex.test(model) && model.length >= 2 && model.length <= 100;
}

/**
 * Validates API key format (basic validation)
 */
export function isValidApiKey(apiKey: string): boolean {
  // Hugging Face API keys typically start with 'hf_' and are 37 characters long
  return /^hf_[a-zA-Z0-9]{34}$/.test(apiKey) || apiKey === 'dummy-test-key';
}

/**
 * Sanitizes user input to prevent injection attacks
 */
export function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .slice(0, 2000); // Enforce max length
}

// ==========================================
// RATE LIMITING VALIDATION
// ==========================================

export const RateLimitConfigSchema = z.object({
  windowMs: z.number().min(1000).max(3600000), // 1 second to 1 hour
  maxRequests: z.number().min(1).max(1000),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
});

export function validateRateLimitConfig(config: unknown): z.infer<typeof RateLimitConfigSchema> {
  try {
    return RateLimitConfigSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Rate limit configuration validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
    }
    throw error;
  }
} 