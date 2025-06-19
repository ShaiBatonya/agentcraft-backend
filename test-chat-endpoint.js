#!/usr/bin/env node

/**
 * Chat Endpoint Testing and Debugging Script
 * Tests the /api/chat endpoint and provides comprehensive debugging
 */

import axios from 'axios';

// Configuration
const BASE_URL = 'http://localhost:3000'; // Correct port
const TEST_PROMPT = 'Tell me a joke about programming';

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logResult(test, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const message = `${status} ${test}${details ? ` - ${details}` : ''}`;
  console.log(message);
  
  results.tests.push({ test, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

async function testServerHealth() {
  console.log('\n🏥 Testing Server Health...');
  
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    logResult('Server health check', response.status === 200 && response.data.status === 'ok');
    return true;
  } catch (error) {
    logResult('Server health check', false, error.code || error.message);
    return false;
  }
}

async function testChatHealth() {
  console.log('\n💬 Testing Chat Health...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/chat/health`, { timeout: 5000 });
    logResult('Chat health check', response.status === 200 && response.data.success === true);
    return true;
  } catch (error) {
    logResult('Chat health check', false, `${error.response?.status || error.code} - ${error.message}`);
    return false;
  }
}

async function testChatEndpointWithoutAuth() {
  console.log('\n🔒 Testing Chat Endpoint (No Auth - Should Fail)...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/chat`, {
      prompt: TEST_PROMPT
    }, { timeout: 5000 });
    
    logResult('Chat without auth', false, 'Should return 401 but got success');
  } catch (error) {
    const expectedStatus = error.response?.status === 401;
    logResult('Chat without auth', expectedStatus, `Status: ${error.response?.status || 'No response'}`);
  }
}

async function testChatValidation() {
  console.log('\n✅ Testing Chat Validation...');
  
  const invalidPayloads = [
    { payload: {}, description: 'Empty payload' },
    { payload: { prompt: '' }, description: 'Empty prompt' },
    { payload: { prompt: 'Hi' }, description: 'Short prompt (< 5 chars)' },
    { payload: { prompt: 123 }, description: 'Non-string prompt' },
    { payload: { prompt: null }, description: 'Null prompt' }
  ];
  
  for (const { payload, description } of invalidPayloads) {
    try {
      const response = await axios.post(`${BASE_URL}/api/chat`, payload, {
        headers: { Cookie: 'token=fake-token' },
        timeout: 5000
      });
      
      logResult(`Validation: ${description}`, false, 'Should return 400 but got success');
    } catch (error) {
      const expectedStatus = error.response?.status === 400 || error.response?.status === 401;
      logResult(`Validation: ${description}`, expectedStatus, `Status: ${error.response?.status || 'No response'}`);
    }
  }
}

async function testCORSHeaders() {
  console.log('\n🌐 Testing CORS Configuration...');
  
  try {
    const response = await axios.options(`${BASE_URL}/api/chat`, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 5000
    });
    
    const hasValidCORS = response.headers['access-control-allow-origin'] === 'http://localhost:5173';
    logResult('CORS headers', hasValidCORS, `Origin: ${response.headers['access-control-allow-origin'] || 'Not set'}`);
  } catch (error) {
    logResult('CORS headers', false, error.message);
  }
}

async function runDiagnostics() {
  console.log('🔍 Chat Endpoint Diagnostics\n');
  console.log('📍 Testing URL:', BASE_URL);
  console.log('🎯 Target Endpoint: POST /api/chat');
  console.log('⚠️  Note: Most tests should FAIL with 401/400 - this is expected!\n');
  
  // Test server connectivity
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ Server is not running or not accessible!');
    console.log('📝 Start server with: pnpm run dev');
    return;
  }
  
  // Test chat service health
  await testChatHealth();
  
  // Test authentication (should fail)
  await testChatEndpointWithoutAuth();
  
  // Test validation (should fail)
  await testChatValidation();
  
  // Test CORS
  await testCORSHeaders();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  // Specific diagnostics
  console.log('\n🔧 Diagnostics:');
  const healthTest = results.tests.find(t => t.test === 'Chat health check');
  if (healthTest?.passed) {
    console.log('✅ Chat endpoint is registered and accessible');
  } else {
    console.log('❌ Chat endpoint registration issue');
  }
  
  const authTest = results.tests.find(t => t.test === 'Chat without auth');
  if (authTest?.passed) {
    console.log('✅ Authentication middleware working correctly');
  } else {
    console.log('❌ Authentication middleware issue');
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Ensure server is running: pnpm run dev');
  console.log('2. Test health endpoint: curl http://localhost:3000/api/chat/health');
  console.log('3. Set up .env with HF_API_KEY and other required variables');
  console.log('4. Test with authentication after OAuth login');
  
  console.log('\n🧪 Manual Test Commands:');
  console.log('# Health check:');
  console.log('curl http://localhost:3000/api/chat/health');
  console.log('\n# Chat test (will fail without auth - expected):');
  console.log('curl -X POST http://localhost:3000/api/chat \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"prompt": "Hello world"}\'');
  console.log('\n# After authentication (replace YOUR_JWT with actual token):');
  console.log('curl -X POST http://localhost:3000/api/chat \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "Cookie: token=YOUR_JWT" \\');
  console.log('  -d \'{"prompt": "Tell me a programming joke"}\'');
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('\n💥 Diagnostic script failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('- Ensure Node.js and dependencies are installed');
  console.log('- Check if server is running on port 3000');
  console.log('- Verify network connectivity');
}); 