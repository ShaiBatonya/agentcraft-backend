// gemini.service.ts
// Production-grade Google Gemini API service with clean architecture and SOLID principles

import { request } from 'undici';
import { env } from '../../../config/validateEnv.js';

// Types and interfaces
export interface GeminiRequestContent {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiRequest {
  contents: GeminiRequestContent[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export interface GeminiServiceResponse {
  answer: string;
  model: string;
  timestamp: Date;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finishReason: string;
}

export interface GeminiHealthCheck {
  api_status: 'online' | 'offline';
  model: string;
  last_check: string;
  response_time?: number;
  error?: string;
}

// Configuration interface
export interface GeminiConfig {
  model: string;
  temperature: number;
  topK: number;
  topP: number;
  maxOutputTokens: number;
  timeout: number;
  maxRetries: number;
  retryDelay: number;
}

// Default configuration
const DEFAULT_CONFIG: GeminiConfig = {
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048,
  timeout: 30000,
  maxRetries: 2,
  retryDelay: 1000,
};

// Custom error classes
export class GeminiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

export class GeminiAPIError extends GeminiError {
  constructor(message: string, statusCode: number, details?: any) {
    super(message, statusCode, 'API_ERROR', details);
    this.name = 'GeminiAPIError';
  }
}

export class GeminiTimeoutError extends GeminiError {
  constructor(message: string = 'Request timeout') {
    super(message, 408, 'TIMEOUT_ERROR');
    this.name = 'GeminiTimeoutError';
  }
}

export class GeminiService {
  private config: GeminiConfig;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';

  constructor(config: Partial<GeminiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate chat response using Gemini API
   */
  async generateResponse(
    prompt: string,
    context: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    userId: string
  ): Promise<GeminiServiceResponse> {
    const startTime = Date.now();

    try {
      // Validate input
      this.validateInput(prompt);

      // Build conversation context
      const contents = this.buildConversationContext(prompt, context);

      // Create request payload
      const requestBody: GeminiRequest = {
        contents,
        generationConfig: {
          temperature: this.config.temperature,
          topK: this.config.topK,
          topP: this.config.topP,
          maxOutputTokens: this.config.maxOutputTokens,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      // Make API call with retry logic
      const response = await this.callGeminiAPI(requestBody);

      // Process and validate response
      const processedResponse = this.processGeminiResponse(response, prompt);

      // Log successful request
      const responseTime = Date.now() - startTime;
      console.log(`✅ Gemini request completed - User: ${userId}, Model: ${this.config.model}, Time: ${responseTime}ms`);

      return processedResponse;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ Gemini request failed - User: ${userId}, Time: ${responseTime}ms, Error:`, error);
      throw this.handleGeminiError(error);
    }
  }

  /**
   * Health check for Gemini API
   */
  async checkHealth(): Promise<GeminiHealthCheck> {
    const startTime = Date.now();

    try {
      // Simple health check with minimal request
      const testContents: GeminiRequestContent[] = [
        {
          role: 'user',
          parts: [{ text: 'Hello' }]
        }
      ];

      const requestBody: GeminiRequest = {
        contents: testContents,
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1,
        }
      };

      await this.callGeminiAPI(requestBody);

      const responseTime = Date.now() - startTime;

      return {
        api_status: 'online',
        model: this.config.model,
        last_check: new Date().toISOString(),
        response_time: responseTime,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error('Gemini health check failed:', error);

      return {
        api_status: 'offline',
        model: this.config.model,
        last_check: new Date().toISOString(),
        response_time: responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<GeminiConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): GeminiConfig {
    return { ...this.config };
  }

  // Private helper methods

  /**
   * Validate input prompt
   */
  private validateInput(prompt: string): void {
    if (!prompt || typeof prompt !== 'string') {
      throw new GeminiError('Prompt is required and must be a string', 400, 'VALIDATION_ERROR');
    }

    if (prompt.trim().length === 0) {
      throw new GeminiError('Prompt cannot be empty', 400, 'VALIDATION_ERROR');
    }

    if (prompt.trim().length < 1) {
      throw new GeminiError('Prompt must be at least 1 character long', 400, 'VALIDATION_ERROR');
    }

    if (prompt.length > 30000) {
      throw new GeminiError('Prompt exceeds maximum length of 30,000 characters', 400, 'VALIDATION_ERROR');
    }
  }

  /**
   * Build conversation context for Gemini API
   */
  private buildConversationContext(
    prompt: string,
    context: Array<{ role: 'user' | 'assistant'; content: string }>
  ): GeminiRequestContent[] {
    const contents: GeminiRequestContent[] = [];

    // Add context messages (convert assistant to model)
    for (const message of context) {
      contents.push({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }]
      });
    }

    // Add current prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt.trim() }]
    });

    return contents;
  }

  /**
   * Make API call to Gemini with retry logic
   */
  private async callGeminiAPI(requestBody: GeminiRequest): Promise<GeminiResponse> {
    const url = `${this.baseUrl}/models/${this.config.model}:generateContent`;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`🔗 Calling Gemini API (attempt ${attempt + 1}/${this.config.maxRetries + 1}): ${this.config.model}`);

        const response = await request(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': env.GEMINI_API_KEY,
          },
          body: JSON.stringify(requestBody),
          bodyTimeout: this.config.timeout,
          headersTimeout: this.config.timeout,
        });

        if (response.statusCode === 200) {
          const responseBody = await response.body.json() as GeminiResponse;
          console.log(`✅ Gemini API response received: ${response.statusCode}`);
          return responseBody;
        }

        // Handle API errors
        const errorBody = await response.body.text();
        let errorMessage = `Gemini API error: ${response.statusCode}`;
        
        try {
          const parsedError = JSON.parse(errorBody);
          errorMessage = parsedError.error?.message || errorMessage;
        } catch {
          // Use default error message if JSON parsing fails
        }

        if (response.statusCode === 401) {
          throw new GeminiAPIError('Invalid API key', 401, { statusCode: response.statusCode });
        }
        
        if (response.statusCode === 403) {
          throw new GeminiAPIError('API access forbidden - check permissions', 403, { statusCode: response.statusCode });
        }
        
        if (response.statusCode === 429) {
          // Rate limit - retry with exponential backoff
          if (attempt < this.config.maxRetries) {
            const delay = this.config.retryDelay * Math.pow(2, attempt);
            console.log(`⏳ Rate limited, retrying in ${delay}ms...`);
            await this.sleep(delay);
            continue;
          }
          throw new GeminiAPIError('Rate limit exceeded', 429, { statusCode: response.statusCode });
        }

        if (response.statusCode >= 500) {
          // Server error - retry
          if (attempt < this.config.maxRetries) {
            const delay = this.config.retryDelay * Math.pow(2, attempt);
            console.log(`🔄 Server error, retrying in ${delay}ms...`);
            await this.sleep(delay);
            continue;
          }
        }

        throw new GeminiAPIError(errorMessage, response.statusCode, { 
          statusCode: response.statusCode,
          body: errorBody 
        });

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on client errors (4xx except 429)
        if (error instanceof GeminiAPIError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
          throw error;
        }

        // Retry on network errors and server errors
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          console.log(`🔄 Network error, retrying in ${delay}ms...`);
          await this.sleep(delay);
          continue;
        }
      }
    }

    // All retries exhausted
    throw lastError || new GeminiError('Max retries exceeded');
  }

  /**
   * Process Gemini API response
   */
  private processGeminiResponse(response: GeminiResponse, originalPrompt: string): GeminiServiceResponse {
    // Validate response structure
    if (!response.candidates || response.candidates.length === 0) {
      throw new GeminiError('No candidates in response', 500, 'INVALID_RESPONSE');
    }

    const candidate = response.candidates[0];
    
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      throw new GeminiError('No content in response candidate', 500, 'INVALID_RESPONSE');
    }

    const generatedText = candidate.content.parts[0].text;
    
    if (!generatedText || generatedText.trim().length === 0) {
      throw new GeminiError('Empty response generated', 500, 'EMPTY_RESPONSE');
    }

    // Clean and format the response
    const cleanedResponse = this.cleanResponse(generatedText);

    return {
      answer: cleanedResponse,
      model: this.config.model,
      timestamp: new Date(),
      usage: {
        prompt_tokens: response.usageMetadata?.promptTokenCount || 0,
        completion_tokens: response.usageMetadata?.candidatesTokenCount || 0,
        total_tokens: response.usageMetadata?.totalTokenCount || 0,
      },
      finishReason: candidate.finishReason || 'STOP',
    };
  }

  /**
   * Clean the AI response
   */
  private cleanResponse(response: string): string {
    return response
      .trim()
      .replace(/^\s*[\r\n]+/gm, '') // Remove leading whitespace and newlines
      .replace(/\s*[\r\n]+\s*/g, '\n') // Normalize line breaks
      .replace(/\s{2,}/g, ' '); // Replace multiple spaces with single space
  }

  /**
   * Handle and format errors
   */
  private handleGeminiError(error: unknown): GeminiError {
    if (error instanceof GeminiError) {
      return error;
    }

    if (error instanceof Error) {
      // Check for timeout errors
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        return new GeminiTimeoutError('Request timeout - Gemini API did not respond in time');
      }

      // Check for network errors
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return new GeminiError('Network error - Cannot reach Gemini API', 503, 'NETWORK_ERROR');
      }

      return new GeminiError(error.message, 500, 'UNKNOWN_ERROR');
    }

    return new GeminiError('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const geminiService = new GeminiService(); 