// Main entry point for the Express app. Sets up middleware, connects to MongoDB, and loads feature routes.
import express from 'express';
import { connectDB } from './config/db.js';
import { env } from './config/validateEnv.js';
import chatRouter from './features/chat/chat.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

const app = express();

app.use(express.json());

// Health check endpoint
app.get('/health', function(_req, res) {
  res.json({ status: 'ok' });
});

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