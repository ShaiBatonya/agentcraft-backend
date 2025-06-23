import dotenv from 'dotenv';
import { z } from 'zod';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Only try to load .env in development
if (process.env.NODE_ENV !== 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const rootDir = resolve(__dirname, '../../..');
  
  dotenv.config({ path: resolve(rootDir, '.env') });
}

// Define the schema for environment variables
const envSchema = z.object({
  // Server Configuration
  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val < 65536, 'PORT must be a valid port number'),
  
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  
  // Client Configuration
  CLIENT_URL: z
    .string()
    .default('http://localhost:5174'),
  
  // Database Configuration
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required'),
  
  // JWT Configuration
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long for security'),
  
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z
    .string()
    .min(1, 'GOOGLE_CLIENT_ID is required'),
  
  GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, 'GOOGLE_CLIENT_SECRET is required'),
  
  // Google Gemini API Configuration
  GEMINI_API_KEY: z
    .string()
    .min(1, 'GEMINI_API_KEY is required'),
});

// Parse and validate environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parseResult.error.flatten().fieldErrors, null, 2));
  
  console.error('\n📋 Required environment variables:');
  console.error('- MONGODB_URI: MongoDB connection string');
  console.error('- JWT_SECRET: Secret for signing JWT tokens (min 32 chars)');
  console.error('- GOOGLE_CLIENT_ID: Google OAuth client ID');
  console.error('- GOOGLE_CLIENT_SECRET: Google OAuth client secret');
  console.error('- GEMINI_API_KEY: Google Gemini API key');
  console.error('\n💡 Please check your environment variables are properly set.');
  
  process.exit(1);
}

// Export the validated environment variables
export const env = parseResult.data;

// Log successful loading (only in development)
if (env.NODE_ENV === 'development') {
  console.log('✅ Environment variables loaded and validated successfully');
  console.log(`🚀 Server will run on port ${env.PORT}`);
  console.log(`🔗 Client URL: ${env.CLIENT_URL}`);
  console.log(`📦 Database: ${env.MONGODB_URI.split('@')[1]?.split('/')[0] || 'MongoDB'}`);
  console.log(`🔐 Google OAuth: ${env.GOOGLE_CLIENT_ID.split('-')[0]}...`);
  console.log(`🤖 Gemini API: ${env.GEMINI_API_KEY.substring(0, 10)}...`);
} 