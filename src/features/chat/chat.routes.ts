// chat.routes.ts
// Express router for chat feature endpoints.

import { Router } from 'express';
import { chatHandler } from './chat.controller';

const router = Router();

// POST /api/chat - Get AI chat response
router.post('/api/chat', chatHandler);

export default router; 