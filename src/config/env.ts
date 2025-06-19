import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables from .env file
// Use path.resolve to ensure we're looking in the correct directory
const envPath = path.resolve(process.cwd(), '.env');

// Debug logging to see where we're looking for the .env file
console.log('🔍 Looking for .env file at:', envPath);
console.log('📁 Current working directory:', process.cwd());

const result = dotenv.config({ 
  path: envPath 
});

if (result.error) {
  console.error('❌ Error loading .env file:', result.error.message);
  
  // Try loading from the server directory specifically
  const serverEnvPath = path.resolve(__dirname, '../../../.env');
  console.log('🔍 Trying alternative path:', serverEnvPath);
  
  const altResult = dotenv.config({ 
    path: serverEnvPath 
  });
  
  if (altResult.error) {
    console.error('❌ Error loading .env file from alternative path:', altResult.error.message);
  } else {
    console.log('✅ Successfully loaded .env from alternative path');
  }
} else {
  console.log('✅ Successfully loaded .env file');
}

// Define the schema for environment variables
const envSchema = z.object({
  // Server Configuration
  PORT: z
    .string()
    .min(1, 'PORT is required')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val < 65536, 'PORT must be a valid port number'),
  
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  
  // Client Configuration
  CLIENT_URL: z
    .string()
    .url('CLIENT_URL must be a valid URL')
    .default('http://localhost:5173'),
  
  // Database Configuration
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .refine(
      (val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
      'MONGODB_URI must be a valid MongoDB connection string'
    ),
  
  // JWT Configuration
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long for security'),
  
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: z
    .string()
    .min(1, 'GOOGLE_CLIENT_ID is required')
    .refine(
      (val) => val.includes('.apps.googleusercontent.com'),
      'GOOGLE_CLIENT_ID must be a valid Google OAuth client ID'
    ),
  
  GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, 'GOOGLE_CLIENT_SECRET is required'),
  
  // Google Gemini API Configuration
  GEMINI_API_KEY: z
    .string()
    .min(1, 'GEMINI_API_KEY is required for Google Gemini API access')
    .refine(
      (val) => val.length >= 39,
      'GEMINI_API_KEY must be a valid Google API key (minimum 39 characters)'
    ),
});

// Parse and validate environment variables
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parseResult.error.flatten().fieldErrors, null, 2));
  
  console.error('\n📋 Required environment variables:');
  console.error('- PORT: Server port number');
  console.error('- MONGODB_URI: MongoDB connection string');
  console.error('- JWT_SECRET: Secret for signing JWT tokens (min 32 chars)');
  console.error('- GOOGLE_CLIENT_ID: Google OAuth client ID');
  console.error('- GOOGLE_CLIENT_SECRET: Google OAuth client secret');
  console.error('- GEMINI_API_KEY: Google Gemini API key');
  console.error('\n💡 Please check your .env file and ensure all variables are properly set.');
  
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