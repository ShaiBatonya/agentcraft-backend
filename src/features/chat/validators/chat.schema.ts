import { z } from 'zod';

// Chat request validation schema
export const chatRequestSchema = z.object({
  prompt: z
    .string()
    .min(5, 'Prompt must be at least 5 characters long')
    .max(2000, 'Prompt must be less than 2000 characters')
    .trim(),
});

// Chat response validation schema
export const chatResponseSchema = z.object({
  answer: z.string(),
  timestamp: z.string(),
  model: z.string(),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    completion_tokens: z.number().optional(),
    total_tokens: z.number().optional(),
  }).optional(),
});

// Error response validation schema
export const chatErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional(),
});

// Hugging Face API response validation
export const huggingFaceResponseSchema = z.array(
  z.object({
    generated_text: z.string(),
  })
);

// Chat configuration schema
export const chatConfigSchema = z.object({
  model: z.string().optional(),
  maxLength: z.number().min(1).max(2000).optional(),
  temperature: z.number().min(0).max(1).optional(),
  topP: z.number().min(0).max(1).optional(),
  doSample: z.boolean().optional(),
  returnFullText: z.boolean().optional(),
});

// Environment validation schema for chat-related variables
export const chatEnvSchema = z.object({
  HF_API_KEY: z.string().min(1, 'HF_API_KEY is required for Hugging Face API access'),
});

// Request body validation helpers
export const validateChatRequest = (data: unknown) => chatRequestSchema.parse(data);
export const validateChatResponse = (data: unknown) => chatResponseSchema.parse(data);
export const validateHuggingFaceResponse = (data: unknown) => huggingFaceResponseSchema.parse(data);
export const validateChatConfig = (data: unknown) => chatConfigSchema.parse(data);

// Type exports for use in other modules
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type ChatResponse = z.infer<typeof chatResponseSchema>;
export type ChatError = z.infer<typeof chatErrorSchema>;
export type HuggingFaceResponse = z.infer<typeof huggingFaceResponseSchema>;
export type ChatConfig = z.infer<typeof chatConfigSchema>; 