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