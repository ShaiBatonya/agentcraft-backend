// chat.routes.ts
// Defines all chat-related API routes and attaches them to an Express router.

import { Router } from 'express';
import { getChatHistory, sendMessage } from './chat.controller';

const router = Router();

// GET /chat/history - Get chat history
router.get('/chat/history', getChatHistory);

// POST /chat/message - Send a new chat message
router.post('/chat/message', sendMessage);

export default router; 