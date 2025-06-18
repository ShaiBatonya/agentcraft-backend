// chat.controller.ts
// Handles chat API requests and responses.

import { Request, Response } from 'express';
import { getChatResponse } from './chat.service.js';
import { ChatRequest, ChatResponse } from './chat.types.js';

/**
 * POST /api/chat
 * Receives a prompt and returns an AI response.
 */
export const chatHandler = async (req: Request, res: Response) => {
  const { prompt } = req.body as ChatRequest;
  const response: ChatResponse = {
    response: await getChatResponse(prompt),
  };
  res.json(response);
}; 