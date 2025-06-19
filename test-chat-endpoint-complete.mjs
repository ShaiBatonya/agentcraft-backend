// test-chat-endpoint-complete.mjs
// Complete test script for /api/chat endpoint with authentication and validation

import axios from 'axios';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = 'super-secret-jwt-key-for-development-at-least-32-characters-long';

// Mock user for testing
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  googleId: 'google-test-123',
  role: 'user'
};

// Generate JWT token for testing
function generateTestJWT(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1d' });
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n🔍 Testing server health...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server health:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Server health check failed:', error.message);
    return false;
  }
}

async function testChatHealthEndpoint() {
  console.log('\n🔍 Testing chat service health...');
  try {
    const response = await axios.get(`${BASE_URL}/api/chat/health`);
    console.log('✅ Chat health:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Chat health check failed:', error.message);
    return false;
  }
}

async function testUnauthenticatedRequest() {
  console.log('\n🔍 Testing unauthenticated request (should fail)...');
  try {
    const response = await axios.post(`${BASE_URL}/api/chat`, {
      prompt: 'Hello, this should fail without auth'
    });
    console.error('❌ Request should have failed but succeeded:', response.data);
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Correctly rejected unauthenticated request');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function testInvalidPrompt() {
  console.log('\n🔍 Testing invalid prompt (too short)...');
  const token = generateTestJWT(testUser);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/chat`, {
      prompt: 'Hi' // Too short (less than 5 characters)
    }, {
      headers: {
        'Cookie': `token=${token}`
      }
    });
    console.error('❌ Request should have failed but succeeded:', response.data);
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Correctly rejected invalid prompt');
      console.log('   Response:', error.response.data);
      return true;
    } else {
      console.error('❌ Unexpected error:', error.message);
      return false;
    }
  }
}

async function testValidChatRequest() {
  console.log('\n🔍 Testing valid chat request...');
  const token = generateTestJWT(testUser);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/chat`, {
      prompt: 'Hello, how are you today?'
    }, {
      headers: {
        'Cookie': `token=${token}`
      },
      timeout: 35000 // 35 second timeout for Hugging Face API
    });
    
    console.log('✅ Chat request successful!');
    console.log('   Status:', response.status);
    console.log('   Response structure:', {
      success: response.data.success,
      hasData: !!response.data.data,
      answer: response.data.data?.answer?.substring(0, 100) + '...',
      timestamp: response.data.data?.timestamp,
      model: response.data.data?.model,
      usage: response.data.data?.usage
    });
    
    // Validate response structure
    const { data } = response.data;
    if (!data.answer || !data.timestamp || !data.model) {
      console.error('❌ Response missing required fields');
      return false;
    }
    
    return true;
  } catch (error) {
    if (error.response) {
      console.error('❌ Chat request failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Chat request failed:', error.message);
    }
    return false;
  }
}

async function testEndpointRouting() {
  console.log('\n🔍 Testing endpoint routing...');
  
  // Test if /api/chat returns 404 or proper auth error
  try {
    const response = await axios.get(`${BASE_URL}/api/chat`);
    console.error('❌ GET /api/chat should not be allowed');
    return false;
  } catch (error) {
    if (error.response && (error.response.status === 404 || error.response.status === 405)) {
      console.log('✅ GET /api/chat correctly returns 404/405');
      return true;
    } else {
      console.error('❌ Unexpected error:', error.response?.status, error.message);
      return false;
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive chat endpoint tests...');
  console.log('📍 Testing endpoint: POST /api/chat');
  console.log('🔐 JWT Secret length:', JWT_SECRET.length, 'characters');
  
  const tests = [
    { name: 'Server Health', fn: testHealthEndpoint },
    { name: 'Chat Health', fn: testChatHealthEndpoint },
    { name: 'Endpoint Routing', fn: testEndpointRouting },
    { name: 'Unauthenticated Request', fn: testUnauthenticatedRequest },
    { name: 'Invalid Prompt', fn: testInvalidPrompt },
    { name: 'Valid Chat Request', fn: testValidChatRequest }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Chat endpoint is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above for details.');
  }
}

// Environment check
function checkEnvironment() {
  console.log('\n🔧 Environment Check:');
  console.log('   Base URL:', BASE_URL);
  console.log('   JWT Secret:', JWT_SECRET ? `Set (${JWT_SECRET.length} chars)` : 'Not set');
  console.log('   Node.js version:', process.version);
  console.log('   ✅ All packages available');
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error.message);
  process.exit(1);
});

// Run tests
(async () => {
  checkEnvironment();
  await runAllTests();
})().catch(error => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
}); 