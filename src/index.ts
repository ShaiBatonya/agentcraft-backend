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

// CORS configuration
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
    console.log(`🔗 Client URL: ${env.CLIENT_URL}`);
    console.log(`📚 API Docs: http://localhost:${env.PORT}/api/docs`);
    console.log(`🔐 Google OAuth: /api/auth/google`);
    console.log(`💬 Chat API: /api/chat`);
  });
};

start(); 