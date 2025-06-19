#!/usr/bin/env node

/**
 * Comprehensive endpoint testing script
 * Tests all authentication and chat endpoints with various scenarios
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const TEST_COOKIE = 'test-jwt-token-here'; // Will be replaced with real token

// Test configuration
const tests = {
  passed: 0,
  failed: 0,
  results: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const message = `${status} ${name}${details ? ` - ${details}` : ''}`;
  console.log(message);
  
  tests.results.push({ name, passed, details });
  if (passed) tests.passed++;
  else tests.failed++;
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Endpoints...');
  
  try {
    // Main health check
    const response = await axios.get(`${BASE_URL}/health`);
    logTest('Main health check', response.status === 200 && response.data.status === 'ok');
    
    // Auth health check
    const authHealth = await axios.get(`${BASE_URL}/api/auth/health`);
    logTest('Auth health check', authHealth.status === 200 && authHealth.data.success === true);
    
    // Chat health check
    const chatHealth = await axios.get(`${BASE_URL}/api/chat/health`);
    logTest('Chat health check', chatHealth.status === 200 && chatHealth.data.success === true);
    
  } catch (error) {
    logTest('Health endpoints', false, error.message);
  }
}

async function testAuthEndpoints() {
  console.log('\n🔐 Testing Authentication Endpoints...');
  
  try {
    // Test /api/auth/me without token (should fail)
    try {
      await axios.get(`${BASE_URL}/api/auth/me`);
      logTest('Auth /me without token', false, 'Should return 401');
    } catch (error) {
      logTest('Auth /me without token', error.response?.status === 401);
    }
    
    // Test logout without token (should fail)
    try {
      await axios.post(`${BASE_URL}/api/auth/logout`);
      logTest('Logout without token', false, 'Should return 401');
    } catch (error) {
      logTest('Logout without token', error.response?.status === 401);
    }
    
    // Google OAuth redirect check (should redirect)
    try {
      const response = await axios.get(`${BASE_URL}/api/auth/google`, {
        maxRedirects: 0,
        validateStatus: (status) => status < 400
      });
      logTest('Google OAuth redirect', response.status === 302);
    } catch (error) {
      if (error.response?.status === 302) {
        logTest('Google OAuth redirect', true);
      } else {
        logTest('Google OAuth redirect', false, error.message);
      }
    }
    
  } catch (error) {
    logTest('Auth endpoints', false, error.message);
  }
}

async function testChatEndpoints() {
  console.log('\n💬 Testing Chat Endpoints...');
  
  try {
    // Test chat without authentication (should fail)
    try {
      await axios.post(`${BASE_URL}/api/chat`, {
        prompt: 'Hello'
      });
      logTest('Chat without auth', false, 'Should return 401');
    } catch (error) {
      logTest('Chat without auth', error.response?.status === 401);
    }
    
    // Test chat with empty prompt (should fail validation)
    try {
      await axios.post(`${BASE_URL}/api/chat`, {
        prompt: ''
      }, {
        headers: { Cookie: `token=${TEST_COOKIE}` }
      });
      logTest('Chat with empty prompt', false, 'Should return 400');
    } catch (error) {
      logTest('Chat with empty prompt', error.response?.status === 400);
    }
    
    // Test chat with missing prompt (should fail validation)
    try {
      await axios.post(`${BASE_URL}/api/chat`, {}, {
        headers: { Cookie: `token=${TEST_COOKIE}` }
      });
      logTest('Chat with missing prompt', false, 'Should return 400');
    } catch (error) {
      logTest('Chat with missing prompt', error.response?.status === 400);
    }
    
    // Test chat with too long prompt (should fail validation)
    try {
      await axios.post(`${BASE_URL}/api/chat`, {
        prompt: 'a'.repeat(2001)
      }, {
        headers: { Cookie: `token=${TEST_COOKIE}` }
      });
      logTest('Chat with long prompt', false, 'Should return 400');
    } catch (error) {
      logTest('Chat with long prompt', error.response?.status === 400);
    }
    
    // Test admin endpoints without auth (should fail)
    try {
      await axios.get(`${BASE_URL}/api/chat/config`);
      logTest('Chat config without auth', false, 'Should return 401');
    } catch (error) {
      logTest('Chat config without auth', error.response?.status === 401);
    }
    
  } catch (error) {
    logTest('Chat endpoints', false, error.message);
  }
}

async function testValidationSchemas() {
  console.log('\n✅ Testing Validation Schemas...');
  
  try {
    // Test various invalid JSON structures
    const invalidPayloads = [
      { test: 'invalid' },
      { prompt: 123 },
      { prompt: null },
      { prompt: undefined },
      { prompt: {} },
      { prompt: [] }
    ];
    
    for (const payload of invalidPayloads) {
      try {
        await axios.post(`${BASE_URL}/api/chat`, payload, {
          headers: { Cookie: `token=${TEST_COOKIE}` }
        });
        logTest(`Validation for ${JSON.stringify(payload)}`, false, 'Should return 400');
      } catch (error) {
        logTest(`Validation for ${JSON.stringify(payload)}`, error.response?.status === 400);
      }
    }
    
  } catch (error) {
    logTest('Validation schemas', false, error.message);
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  try {
    // Test 404 endpoints
    try {
      await axios.get(`${BASE_URL}/api/nonexistent`);
      logTest('404 handling', false, 'Should return 404');
    } catch (error) {
      logTest('404 handling', error.response?.status === 404);
    }
    
    // Test malformed JSON
    try {
      await axios.post(`${BASE_URL}/api/chat`, '{"invalid": json}', {
        headers: { 
          'Content-Type': 'application/json',
          Cookie: `token=${TEST_COOKIE}` 
        }
      });
      logTest('Malformed JSON', false, 'Should return 400');
    } catch (error) {
      logTest('Malformed JSON', error.response?.status === 400);
    }
    
  } catch (error) {
    logTest('Error handling', false, error.message);
  }
}

async function testCORSConfiguration() {
  console.log('\n🌐 Testing CORS Configuration...');
  
  try {
    // Test CORS headers
    const response = await axios.options(`${BASE_URL}/api/chat`, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST'
      }
    });
    
    const hasCorrectCORS = response.headers['access-control-allow-origin'] === 'http://localhost:5173' &&
                          response.headers['access-control-allow-credentials'] === 'true';
    
    logTest('CORS configuration', hasCorrectCORS);
    
  } catch (error) {
    logTest('CORS configuration', false, error.message);
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive API Tests...\n');
  console.log('⚠️  Note: Some tests expect failures (401, 400, etc.) - this is correct behavior!\n');
  
  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running and reachable\n');
  } catch (error) {
    console.log('❌ Server is not running! Please start with: pnpm run dev\n');
    process.exit(1);
  }
  
  // Run all test suites
  await testHealthCheck();
  await testAuthEndpoints();
  await testChatEndpoints();
  await testValidationSchemas();
  await testErrorHandling();
  await testCORSConfiguration();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${tests.passed}`);
  console.log(`❌ Failed: ${tests.failed}`);
  console.log(`📈 Success Rate: ${((tests.passed / (tests.passed + tests.failed)) * 100).toFixed(1)}%`);
  
  if (tests.failed > 0) {
    console.log('\n❌ Failed Tests:');
    tests.results.filter(t => !t.passed).forEach(test => {
      console.log(`   - ${test.name}${test.details ? ` (${test.details})` : ''}`);
    });
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Set up .env with HF_API_KEY for full chat testing');
  console.log('2. Test authentication flow via browser: http://localhost:3000/api/auth/google');
  console.log('3. Copy JWT cookie and test chat endpoint manually');
  console.log('4. Ready for frontend integration! 🚀');
}

// Run tests
runAllTests().catch(console.error); 