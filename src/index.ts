// Main entry point for the Express app. Sets up middleware, connects to MongoDB, and loads feature routes.
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { connectDB } from './config/db.js';
import { env } from './config/validateEnv.js';
import passport from './config/passport.js';
import { swaggerSpec } from './config/swagger.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

const app = express();

// Development URLs
const devUrls = ['http://localhost:5173', 'http://localhost:5174'];

// Production URLs
const prodUrls = [
  'https://agentcraft-client.onrender.com',
  'https://agentcraft-client-1.onrender.com',
  env.CLIENT_URL
].filter(Boolean);

// CORS configuration
app.use(cors({
  origin: [...devUrls, ...prodUrls], // Allow both development and production URLs
  credentials: true, // Allow cookies and credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200, // Support legacy browsers
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing middleware
app.use(cookieParser());

// Passport middleware
app.use(passport.initialize());

// Swagger UI middleware
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'AgentCraft API Documentation',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

// Health check endpoint
app.get('/health', function(_req, res) {
  res.json({ status: 'ok' });
});

// Central API router (includes all feature routes)
app.use('/api', apiRouter);

// 404 handler
app.use(notFound);
// Error handler
app.use(errorHandler);

const start = async () => {
  await connectDB();
  app.listen(Number(env.PORT), () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
    console.log(`🔗 Client URLs:`, [...prodUrls]);
    console.log(`📚 API Docs: http://localhost:${env.PORT}/api/docs`);
    console.log(`🔐 Google OAuth: /api/auth/google`);
    console.log(`💬 Chat API: /api/chat`);
  });
};

start(); 