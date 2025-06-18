// chat.controller.ts
// Handles incoming requests for chat-related endpoints and delegates business logic to the service layer.

import { Request, Response } from 'express';
import { getChatHistoryService, sendMessageService } from './chat.service';

export const getChatHistory = async (req: Request, res: Response) => {
  const history = await getChatHistoryService();
  res.json(history);
};

export const sendMessage = async (req: Request, res: Response) => {
  const { message } = req.body;
  const response = await sendMessageService(message);
  res.json(response);
}; 