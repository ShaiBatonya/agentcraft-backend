// test-chat-endpoints.mjs
// Automated test suite for /api/chat endpoints to verify proper connection and functionality

import axios from 'axios';
import jwt from 'jsonwebtoken';

// Configuration
const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = 'super-secret-jwt-key-for-development-at-least-32-characters-long';

// Test data
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  googleId: 'google-test-123',
  role: 'user'
};

const adminUser = {
  id: 'admin-user-456',
  email: 'admin@example.com',
  name: 'Admin User',
  googleId: 'google-admin-456',
  role: 'admin'
};

// Helper functions
function generateJWT(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1d' });
}

function createCookieHeader(token) {
  return { 'Cookie': `token=${token}` };
}

// Test counter
let testCount = 0;
let passCount = 0;
let failCount = 0;

function logTest(name, success, details = '') {
  testCount++;
  if (success) {
    passCount++;
    console.log(`✅ Test ${testCount}: ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    failCount++;
    console.log(`❌ Test ${testCount}: ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// Test functions
async function testServerHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    const success = response.status === 200 && response.data.status === 'ok';
    logTest('Server Health Check', success, `Status: ${response.status}`);
    return success;
  } catch (error) {
    logTest('Server Health Check', false, `Error: ${error.message}`);
    return false;
  }
}

async function testChatHealthPublic() {
  try {
    const response = await axios.get(`${BASE_URL}/api/chat/health`);
    const success = response.status === 200 && response.data.success === true;
    logTest('Chat Health Check (Public)', success, `Status: ${response.status}, Message: ${response.data.message}`);
    return success;
  } catch (error) {
    logTest('Chat Health Check (Public)', false, `Error: ${error.message}`);
    return false;
  }
}

async function testChatEndpointUnauthenticated() {
  try {
    const response = await axios.post(`${BASE_URL}/api/chat`, {
      prompt: 'Hello, this should require authentication'
    });
    logTest('Chat Endpoint Without Auth (should fail)', false, `Unexpected success: ${response.status}`);
    return false;
  } catch (error) {
    const success = error.response && error.response.status === 401;
    logTest('Chat Endpoint Without Auth (should fail)', success, `Status: ${error.response?.status}, Expected: 401`);
    return success;
  }
}

async function testChatEndpointInvalidPrompt() {
  try {
    const token = generateJWT(testUser);
    const response = await axios.post(`${BASE_URL}/api/chat`, {
      prompt: 'Hi' // Too short
    }, {
      headers: createCookieHeader(token)
    });
    logTest('Chat Endpoint Invalid Prompt (should fail)', false, `Unexpected success: ${response.status}`);
    return false;
  } catch (error) {
    const success = error.response && error.response.status === 400;
    logTest('Chat Endpoint Invalid Prompt (should fail)', success, `Status: ${error.response?.status}, Expected: 400`);
    return success;
  }
}

async function testChatEndpointValidRequest() {
  try {
    const token = generateJWT(testUser);
    const response = await axios.post(`${BASE_URL}/api/chat`, {
      prompt: 'Hello, how are you today? This is a test message.'
    }, {
      headers: createCookieHeader(token),
      timeout: 35000
    });
    
    const data = response.data;
    const success = response.status === 200 && 
                   data.answer && 
                   data.timestamp && 
                   data.model;
    
    logTest('Chat Endpoint Valid Request', success, `Status: ${response.status}, Has Answer: ${!!data.answer}`);
    return success;
  } catch (error) {
    const details = error.response ? 
      `Status: ${error.response.status}, Error: ${error.response.data?.error || error.message}` :
      `Error: ${error.message}`;
    logTest('Chat Endpoint Valid Request', false, details);
    return false;
  }
}

async function testChatConfigAdminOnly() {
  try {
    const userToken = generateJWT(testUser);
    const response = await axios.get(`${BASE_URL}/api/chat/config`, {
      headers: createCookieHeader(userToken)
    });
    logTest('Chat Config Endpoint (non-admin should fail)', false, `Unexpected success: ${response.status}`);
    return false;
  } catch (error) {
    const success = error.response && (error.response.status === 403 || error.response.status === 401);
    logTest('Chat Config Endpoint (non-admin should fail)', success, `Status: ${error.response?.status}, Expected: 403`);
    return success;
  }
}

async function testChatConfigWithAdmin() {
  try {
    const adminToken = generateJWT(adminUser);
    const response = await axios.get(`${BASE_URL}/api/chat/config`, {
      headers: createCookieHeader(adminToken)
    });
    
    const success = response.status === 200 && response.data.success === true;
    logTest('Chat Config Endpoint (admin access)', success, `Status: ${response.status}, Has Config: ${!!response.data.config}`);
    return success;
  } catch (error) {
    const details = error.response ? 
      `Status: ${error.response.status}, Error: ${error.response.data?.error || error.message}` :
      `Error: ${error.message}`;
    logTest('Chat Config Endpoint (admin access)', false, details);
    return false;
  }
}

async function testRouteNotFound() {
  try {
    const response = await axios.get(`${BASE_URL}/api/chat/nonexistent`);
    logTest('Non-existent Route (should 404)', false, `Unexpected success: ${response.status}`);
    return false;
  } catch (error) {
    const success = error.response && error.response.status === 404;
    logTest('Non-existent Route (should 404)', success, `Status: ${error.response?.status}, Expected: 404`);
    return success;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Chat Endpoint Connection Tests');
  console.log('📍 Target: /api/chat endpoints');
  console.log('🔐 JWT Secret Length:', JWT_SECRET.length, 'characters');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('');

  const tests = [
    { name: 'Server Health', fn: testServerHealth },
    { name: 'Chat Health Public', fn: testChatHealthPublic },
    { name: 'Unauthenticated Request', fn: testChatEndpointUnauthenticated },
    { name: 'Invalid Prompt', fn: testChatEndpointInvalidPrompt },
    { name: 'Valid Chat Request', fn: testChatEndpointValidRequest },
    { name: 'Config Non-Admin', fn: testChatConfigAdminOnly },
    { name: 'Config Admin Access', fn: testChatConfigWithAdmin },
    { name: 'Route Not Found', fn: testRouteNotFound }
  ];

  console.log('Running tests...\n');

  for (const test of tests) {
    try {
      await test.fn();
    } catch (error) {
      logTest(test.name, false, `Exception: ${error.message}`);
    }
  }

  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passCount}/${testCount}`);
  console.log(`❌ Failed: ${failCount}/${testCount}`);
  console.log(`📈 Success Rate: ${Math.round((passCount / testCount) * 100)}%`);

  if (failCount === 0) {
    console.log('\n🎉 All tests passed! Chat endpoints are properly connected and functional.');
    console.log('✅ Router is correctly mounted at /api/chat');
    console.log('✅ Authentication middleware is working');
    console.log('✅ Authorization middleware is working');
    console.log('✅ Validation is working');
    console.log('✅ All endpoints respond correctly');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
    if (failCount === testCount) {
      console.log('❌ No endpoints are responding - check if server is running');
    }
  }

  return failCount === 0;
}

// Environment check
function checkEnvironment() {
  console.log('🔧 Environment Check:');
  console.log('   Base URL:', BASE_URL);
  console.log('   JWT Secret:', JWT_SECRET ? `Set (${JWT_SECRET.length} chars)` : 'Not set');
  console.log('   Node.js version:', process.version);
  console.log('   ✅ All packages available\n');
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error.message);
  process.exit(1);
});

// Run tests
(async () => {
  checkEnvironment();
  const success = await runAllTests();
  process.exit(success ? 0 : 1);
})().catch(error => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
}); 