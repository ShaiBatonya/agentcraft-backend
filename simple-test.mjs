// simple-test.mjs
// Simple test to verify chat endpoint structure

// Set required environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/agentcraft';
process.env.PORT = '3000';
process.env.NODE_ENV = 'development';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.JWT_SECRET = 'super-secret-jwt-key-for-development-at-least-32-characters-long';
process.env.GOOGLE_CLIENT_ID = 'dummy-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'dummy-google-client-secret';
process.env.HF_API_KEY = 'dummy-hf-api-key';

console.log('🔧 Environment configured');
console.log('🚀 Starting server...');

// Import and start the server
import('./dist/index.js').then(() => {
  console.log('✅ Server import successful');
  
  // Wait a bit then test the endpoints
  setTimeout(async () => {
    try {
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Health endpoint working:', data);
        
        // Test chat health
        try {
          const chatHealth = await fetch('http://localhost:3000/api/chat/health');
          if (chatHealth.ok) {
            const chatData = await chatHealth.json();
            console.log('✅ Chat health endpoint working:', chatData);
          } else {
            console.log('❌ Chat health endpoint status:', chatHealth.status);
          }
        } catch (err) {
          console.log('❌ Chat health endpoint error:', err.message);
        }
        
        // Test auth-protected endpoint (should fail with 401)
        try {
          const chatResponse = await fetch('http://localhost:3000/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'Hello' })
          });
          console.log('🔐 Chat endpoint status without auth:', chatResponse.status);
          if (chatResponse.status === 401) {
            console.log('✅ Authentication properly required');
          }
        } catch (err) {
          console.log('❌ Chat endpoint error:', err.message);
        }
        
      } else {
        console.log('❌ Health endpoint failed:', response.status);
      }
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
    }
    
    console.log('\n🏁 Test complete');
    process.exit(0);
  }, 2000);
  
}).catch(error => {
  console.error('❌ Server start failed:', error.message);
  process.exit(1);
}); 