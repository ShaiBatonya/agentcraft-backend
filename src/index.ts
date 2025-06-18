// index.ts
// Main entry point for the Express app. Sets up middleware, connects to MongoDB, and loads feature routes.

import 'express-async-errors';
import express from 'express';
import { connectDB } from './config/db';
import { env } from './config/validateEnv';
import chatRouter from './features/chat/chat.routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';

const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Feature routes
app.use(chatRouter);

// 404 handler
app.use(notFound);
// Error handler
app.use(errorHandler);

const start = async () => {
  await connectDB();
  app.listen(Number(env.PORT), () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
};

start(); 