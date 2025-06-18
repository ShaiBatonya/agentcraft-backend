// chat.types.ts
// Defines TypeScript types and interfaces for chat-related data structures.

export interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  timestamp: Date;
} 