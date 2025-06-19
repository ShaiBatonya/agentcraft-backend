// start-test-server.js
// Starts the server with minimal environment for testing

// Set environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/agentcraft';
process.env.PORT = '3000';
process.env.NODE_ENV = 'development';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.JWT_SECRET = 'super-secret-jwt-key-for-development-at-least-32-characters-long';
process.env.GOOGLE_CLIENT_ID = 'dummy-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'dummy-google-client-secret';
process.env.HF_API_KEY = 'dummy-hf-api-key'; // Will cause API errors but won't crash the server

console.log('🔧 Setting up test environment...');
console.log('📡 Port:', process.env.PORT);
console.log('🔐 JWT Secret length:', process.env.JWT_SECRET.length);
console.log('🤖 HF API Key:', process.env.HF_API_KEY ? 'Set (dummy)' : 'Not set');

// Start the server
import('./dist/index.js'); 