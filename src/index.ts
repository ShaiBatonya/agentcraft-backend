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

// CORS configuration with enhanced cross-origin cookie support
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [...devUrls, ...prodUrls];
    
    // Allow any *.onrender.com subdomain in production
    if (env.NODE_ENV === 'production' && origin.includes('.onrender.com')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true, // Critical for cross-origin cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cookie', 
    'Set-Cookie',
    'Access-Control-Allow-Credentials',
    'Access-Control-Allow-Origin'
  ],
  exposedHeaders: ['Set-Cookie', 'Authorization'],
  optionsSuccessStatus: 200, // Support legacy browsers
  preflightContinue: false,
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