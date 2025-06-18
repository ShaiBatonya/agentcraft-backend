// chat.types.ts
// TypeScript types and interfaces for chat feature.

export interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  timestamp: Date;
}

export interface ChatRequest {
  prompt: string;
}

export interface ChatResponse {
  response: string;
} 