import { env } from './src/config/validateEnv.js';

console.log('\n🔍 Checking Auth Configuration...\n');

// Check environment
console.log('Environment:', {
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  CLIENT_URL: env.CLIENT_URL
});

// Check Google OAuth config
console.log('\nGoogle OAuth:', {
  CLIENT_ID: env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing',
  CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
  HAS_CORRECT_DOMAIN: env.GOOGLE_CLIENT_ID?.includes('.apps.googleusercontent.com') ? '✅ Yes' : '❌ No'
});

// Check JWT config
console.log('\nJWT:', {
  SECRET: env.JWT_SECRET ? '✅ Set' : '❌ Missing',
  SECRET_LENGTH: env.JWT_SECRET?.length || 0,
  IS_SECURE: (env.JWT_SECRET?.length || 0) >= 32 ? '✅ Yes' : '❌ No'
});

// Construct and check callback URLs
const serverUrl = `http://localhost:${env.PORT}`;
const expectedCallbackUrl = `${serverUrl}/api/auth/google/callback`;

console.log('\nCallback URLs:', {
  SERVER_URL: serverUrl,
  CALLBACK_URL: expectedCallbackUrl
});

console.log('\n✨ Verification complete!\n'); 