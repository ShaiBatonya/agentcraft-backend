// chat.service.ts
// Business logic for chat feature with Google Gemini API integration

import { 
  GeminiService, 
  GeminiConfig, 
  GeminiServiceResponse,
  GeminiHealthCheck,
  GeminiError,
  geminiService 
} from './gemini.service.js';
import { ChatThread, ChatThreadType } from '../../../models/ChatThread.js';
import { ChatMessage, ChatMessageType } from '../../../models/ChatMessage.js';
import { Types } from 'mongoose';

// Updated interfaces for Gemini
export interface ChatServiceResponse {
  answer: string;
  model: string;
  timestamp: Date;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finishReason?: string;
}

export interface ChatServiceConfig {
  model?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  timeout?: number;
  maxRetries?: number;
}

export interface ChatHealthResponse {
  api_status: 'online' | 'offline';
  model: string;
  last_check: string;
  response_time?: number;
  error?: string;
}

// Thread persistence interfaces
export interface CreateThreadRequest {
  title?: string;
}

export interface CreateThreadResponse {
  _id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  userMessage: {
    _id: string;
    threadId: string;
    role: 'user';
    content: string;
    createdAt: Date;
  };
  assistantMessage: {
    _id: string;
    threadId: string;
    role: 'assistant';
    content: string;
    createdAt: Date;
  };
}

// Default chat configuration for Gemini
const DEFAULT_CONFIG: Partial<GeminiConfig> = {
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
  timeout: 30000,
  maxRetries: 2,
};

export class ChatService {
  private geminiService: GeminiService;

  constructor(geminiServiceInstance: GeminiService = geminiService) {
    // Dependency injection - follows dependency inversion principle
    this.geminiService = geminiServiceInstance;
    
    // Configure the Gemini service with our defaults
    this.geminiService.updateConfig(DEFAULT_CONFIG);
  }

  /**
   * Get AI response from Gemini API
   * Main entry point for chat functionality
   */
  async getChatResponse(
    prompt: string, 
    userId: string,
    context: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<ChatServiceResponse> {
    try {
      // Validate input
      this.validateInput(prompt);

      // Use Gemini service to generate response
      const geminiResponse = await this.geminiService.generateResponse(prompt, context, userId);

      // Transform Gemini response to our ChatService format
      return this.transformGeminiResponse(geminiResponse);

    } catch (error) {
      console.error('Chat service error:', error);
      throw this.handleChatError(error);
    }
  }

  /**
   * Check health of chat service and Gemini API
   */
  async checkHealth(): Promise<ChatHealthResponse> {
    try {
      const healthCheck = await this.geminiService.checkHealth();
      
      return {
        api_status: healthCheck.api_status,
        model: healthCheck.model,
        last_check: healthCheck.last_check,
        response_time: healthCheck.response_time,
        error: healthCheck.error,
      };

    } catch (error) {
      console.error('Chat health check failed:', error);
      
      return {
        api_status: 'offline',
        model: 'gemini-2.0-pro',
        last_check: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update chat configuration
   */
  updateConfig(newConfig: ChatServiceConfig): void {
    // Validate configuration
    this.validateConfig(newConfig);
    
    // Map ChatServiceConfig to GeminiConfig
    const geminiConfig: Partial<GeminiConfig> = {
      model: newConfig.model,
      temperature: newConfig.temperature,
      topK: newConfig.topK,
      topP: newConfig.topP,
      maxOutputTokens: newConfig.maxOutputTokens,
      timeout: newConfig.timeout,
      maxRetries: newConfig.maxRetries,
    };

    // Update Gemini service configuration
    this.geminiService.updateConfig(geminiConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): ChatServiceConfig {
    const geminiConfig = this.geminiService.getConfig();
    
    return {
      model: geminiConfig.model,
      temperature: geminiConfig.temperature,
      topK: geminiConfig.topK,
      topP: geminiConfig.topP,
      maxOutputTokens: geminiConfig.maxOutputTokens,
      timeout: geminiConfig.timeout,
      maxRetries: geminiConfig.maxRetries,
    };
  }

  /**
   * Get available models (Gemini models)
   */
  getAvailableModels(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        description: 'Fast and efficient model optimized for speed (default)'
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        description: 'High-performance model with large context window'
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        description: 'Production-ready Gemini model for general use'
      }
    ];
  }

  // ==========================================
  // THREAD PERSISTENCE METHODS
  // ==========================================

  /**
   * Create a new chat thread for a user
   */
  async createThread(userId: string, request: CreateThreadRequest): Promise<CreateThreadResponse> {
    try {
      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Create new thread
      const thread = new ChatThread({
        userId: new Types.ObjectId(userId),
        title: request.title || 'New Chat',
      });

      const savedThread = await thread.save();

      return {
        _id: savedThread._id.toString(),
        userId: savedThread.userId.toString(),
        title: savedThread.title,
        createdAt: savedThread.createdAt,
        updatedAt: savedThread.updatedAt,
      };

    } catch (error) {
      console.error('Create thread error:', error);
      throw error instanceof Error ? error : new Error('Failed to create thread');
    }
  }

  /**
   * Get all threads for a user
   */
  async getUserThreads(userId: string): Promise<CreateThreadResponse[]> {
    try {
      // Validate user ID
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      // Fetch threads sorted by updatedAt DESC
      const threads = await ChatThread.find({ userId: new Types.ObjectId(userId) })
        .sort({ updatedAt: -1 })
        .lean();

      return threads.map(thread => ({
        _id: (thread._id as Types.ObjectId).toString(),
        userId: (thread.userId as Types.ObjectId).toString(),
        title: thread.title,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
      }));

    } catch (error) {
      console.error('Get user threads error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch threads');
    }
  }

  /**
   * Send a message to a thread and get AI response
   */
  async sendMessageToThread(
    userId: string, 
    threadId: string, 
    request: SendMessageRequest
  ): Promise<SendMessageResponse> {
    try {
      // Validate IDs
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      if (!Types.ObjectId.isValid(threadId)) {
        throw new Error('Invalid thread ID');
      }

      // Verify thread belongs to user
      const thread = await ChatThread.findOne({ 
        _id: new Types.ObjectId(threadId), 
        userId: new Types.ObjectId(userId) 
      });

      if (!thread) {
        throw new Error('Thread not found or access denied');
      }

      // Get previous messages for context (last 10 messages)
      const previousMessages = await ChatMessage.find({ threadId: new Types.ObjectId(threadId) })
        .sort({ createdAt: 1 })
        .limit(10)
        .lean();

      // Build context for AI
      const context = previousMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Save user message
      const userMessage = new ChatMessage({
        threadId: new Types.ObjectId(threadId),
        role: 'user',
        content: request.content.trim(),
      });

      const savedUserMessage = await userMessage.save();

      // Get AI response
      const aiResponse = await this.getChatResponse(request.content, userId, context);

      // Save assistant message
      const assistantMessage = new ChatMessage({
        threadId: new Types.ObjectId(threadId),
        role: 'assistant',
        content: aiResponse.answer,
      });

      const savedAssistantMessage = await assistantMessage.save();

      // Update thread's updatedAt timestamp
      await ChatThread.findByIdAndUpdate(threadId, { updatedAt: new Date() });

      return {
        userMessage: {
          _id: savedUserMessage._id.toString(),
          threadId: savedUserMessage.threadId.toString(),
          role: 'user',
          content: savedUserMessage.content,
          createdAt: savedUserMessage.createdAt,
        },
        assistantMessage: {
          _id: savedAssistantMessage._id.toString(),
          threadId: savedAssistantMessage.threadId.toString(),
          role: 'assistant',
          content: savedAssistantMessage.content,
          createdAt: savedAssistantMessage.createdAt,
        },
      };

    } catch (error) {
      console.error('Send message to thread error:', error);
      throw error instanceof Error ? error : new Error('Failed to send message');
    }
  }

  /**
   * Get all messages in a thread
   */
  async getThreadMessages(userId: string, threadId: string): Promise<Array<{
    _id: string;
    threadId: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }>> {
    try {
      // Validate IDs
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      if (!Types.ObjectId.isValid(threadId)) {
        throw new Error('Invalid thread ID');
      }

      // Verify thread belongs to user
      const thread = await ChatThread.findOne({ 
        _id: new Types.ObjectId(threadId), 
        userId: new Types.ObjectId(userId) 
      });

      if (!thread) {
        throw new Error('Thread not found or access denied');
      }

      // Get all messages in the thread
      const messages = await ChatMessage.find({ threadId: new Types.ObjectId(threadId) })
        .sort({ createdAt: 1 })
        .lean();

      return messages.map(msg => ({
        _id: (msg._id as Types.ObjectId).toString(),
        threadId: (msg.threadId as Types.ObjectId).toString(),
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt,
      }));

    } catch (error) {
      console.error('Get thread messages error:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch messages');
    }
  }

  /**
   * Delete a thread and all its messages
   */
  async deleteThread(userId: string, threadId: string): Promise<void> {
    try {
      // Validate IDs
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }
      if (!Types.ObjectId.isValid(threadId)) {
        throw new Error('Invalid thread ID');
      }

      // Verify thread belongs to user
      const thread = await ChatThread.findOne({ 
        _id: new Types.ObjectId(threadId), 
        userId: new Types.ObjectId(userId) 
      });

      if (!thread) {
        throw new Error('Thread not found or access denied');
      }

      // Delete all messages in the thread first
      await ChatMessage.deleteMany({ threadId: new Types.ObjectId(threadId) });

      // Delete the thread
      await ChatThread.findByIdAndDelete(threadId);

      console.log(`✅ Thread and messages deleted - User: ${userId}, Thread: ${threadId}`);

    } catch (error) {
      console.error('Delete thread error:', error);
      throw error instanceof Error ? error : new Error('Failed to delete thread');
    }
  }

  // Private helper methods

  /**
   * Validate input prompt
   */
  private validateInput(prompt: string): void {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required and must be a string');
    }

    if (prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    if (prompt.trim().length < 1) {
      throw new Error('Prompt must be at least 1 character long');
    }

    if (prompt.length > 30000) {
      throw new Error('Prompt exceeds maximum length of 30,000 characters');
    }
  }

  /**
   * Transform Gemini response to ChatService format
   */
  private transformGeminiResponse(geminiResponse: GeminiServiceResponse): ChatServiceResponse {
    return {
      answer: geminiResponse.answer,
      model: geminiResponse.model,
      timestamp: geminiResponse.timestamp,
      usage: geminiResponse.usage,
      finishReason: geminiResponse.finishReason,
    };
  }

  /**
   * Handle chat service errors
   */
  private handleChatError(error: unknown): Error {
    if (error instanceof GeminiError) {
      // Map Gemini errors to appropriate chat service errors
      switch (error.code) {
        case 'VALIDATION_ERROR':
          return new Error(`Validation failed: ${error.message}`);
        case 'API_ERROR':
          if (error.statusCode === 401) {
            return new Error('Invalid API key');
          }
          if (error.statusCode === 403) {
            return new Error('API access forbidden');
          }
          if (error.statusCode === 429) {
            return new Error('Rate limit exceeded. Please try again later.');
          }
          if (error.statusCode === 503) {
            return new Error('Service temporarily unavailable');
          }
          return new Error(`API error: ${error.message}`);
        case 'TIMEOUT_ERROR':
          return new Error('Request timeout. Please try again.');
        case 'NETWORK_ERROR':
          return new Error('Network error. Please check your connection.');
        default:
          return new Error(error.message);
      }
    }

    if (error instanceof Error) {
      return error;
    }
    
    if (typeof error === 'string') {
      return new Error(error);
    }

    return new Error('An unexpected error occurred while processing your request');
  }

  /**
   * Validate configuration
   */
  private validateConfig(config: ChatServiceConfig): void {
    if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2');
    }
    
    if (config.topP !== undefined && (config.topP < 0 || config.topP > 1)) {
      throw new Error('TopP must be between 0 and 1');
    }
    
    if (config.topK !== undefined && (config.topK < 1 || config.topK > 100)) {
      throw new Error('TopK must be between 1 and 100');
    }
    
    if (config.maxOutputTokens !== undefined && (config.maxOutputTokens < 1 || config.maxOutputTokens > 8192)) {
      throw new Error('MaxOutputTokens must be between 1 and 8192');
    }
    
    if (config.timeout !== undefined && (config.timeout < 5000 || config.timeout > 120000)) {
      throw new Error('Timeout must be between 5 and 120 seconds');
    }
    
    if (config.maxRetries !== undefined && (config.maxRetries < 0 || config.maxRetries > 5)) {
      throw new Error('MaxRetries must be between 0 and 5');
    }
  }
}

// Export singleton instance
export const chatService = new ChatService();

/**
 * Legacy function for backwards compatibility
 */
export async function getChatResponse(prompt: string): Promise<string> {
  const response = await chatService.getChatResponse(prompt, 'anonymous');
  return response.answer;
} 