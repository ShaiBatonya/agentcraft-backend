#!/usr/bin/env node
// test-all-endpoints.mjs
// Comprehensive test script for AgentCraft API endpoints

import { request } from 'undici';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test results storage
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to make HTTP requests with error handling
async function makeRequest(method, url, data = null, headers = {}) {
  const startTime = performance.now();
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      bodyTimeout: 10000,
      headersTimeout: 10000,
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await request(`${API_URL}${url}`, options);
    const endTime = performance.now();
    
    let responseData;
    try {
      const textData = await response.body.text();
      responseData = textData ? JSON.parse(textData) : {};
    } catch {
      responseData = {};
    }
    
    return {
      status: response.statusCode,
      data: responseData,
      headers: response.headers,
      responseTime: Math.round(endTime - startTime)
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      status: 0,
      error: error.message,
      responseTime: Math.round(endTime - startTime)
    };
  }
}

// Test runner function
async function runTest(name, testFn) {
  console.log(`\n🧪 Testing: ${name}`);
  
  try {
    const result = await testFn();
    
    if (result.success) {
      console.log(`   ✅ PASS - ${result.message} (${result.responseTime}ms)`);
      results.passed++;
    } else {
      console.log(`   ❌ FAIL - ${result.message} (${result.responseTime || 0}ms)`);
      results.failed++;
    }
    
    results.tests.push({
      name,
      success: result.success,
      message: result.message,
      responseTime: result.responseTime,
      details: result.details
    });
    
    return result;
  } catch (error) {
    console.log(`   💥 ERROR - ${error.message}`);
    results.failed++;
    
    results.tests.push({
      name,
      success: false,
      message: error.message,
      responseTime: 0
    });
    
    return { success: false, message: error.message };
  }
}

// Individual test functions
async function testApiRoot() {
  const response = await makeRequest('GET', '');
  
  return {
    success: response.status === 200 && response.data?.success === true,
    message: response.status === 200 
      ? `API root responding with version ${response.data?.version || 'unknown'}`
      : `Expected 200, got ${response.status}`,
    responseTime: response.responseTime,
    details: response.data
  };
}

async function testApiStatus() {
  const response = await makeRequest('GET', '/status');
  
  return {
    success: response.status === 200 && response.data?.success === true,
    message: response.status === 200 
      ? `System status: ${Object.values(response.data?.services || {}).join(', ')}`
      : `Expected 200, got ${response.status}`,
    responseTime: response.responseTime,
    details: response.data
  };
}

async function testDebugRoutes() {
  const response = await makeRequest('GET', '/debug/routes');
  
  return {
    success: response.status === 200 && response.data?.success === true,
    message: response.status === 200 
      ? `Found ${response.data?.total_routes || 0} routes`
      : `Expected 200, got ${response.status}`,
    responseTime: response.responseTime,
    details: response.data
  };
}

async function testSwaggerDocs() {
  const response = await makeRequest('GET', '/docs');
  
  return {
    success: response.status === 200,
    message: response.status === 200 
      ? 'Swagger UI accessible'
      : `Swagger UI failed with status ${response.status}`,
    responseTime: response.responseTime,
    details: response.status
  };
}

async function testChatTest() {
  const response = await makeRequest('GET', '/chat/test');
  
  return {
    success: response.status === 200 && response.data?.success === true,
    message: response.status === 200 
      ? `Chat test passed - ${response.data?.service || 'unknown service'}`
      : `Expected 200, got ${response.status}`,
    responseTime: response.responseTime,
    details: response.data
  };
}

async function testChatHealth() {
  const response = await makeRequest('GET', '/chat/health');
  
  const isHealthy = response.data?.api_status === 'online';
  const issues = response.data?.diagnostics?.issues?.length || 0;
  
  return {
    success: response.status === 200,
    message: response.status === 200 
      ? `Chat health: ${response.data?.api_status || 'unknown'} (${issues} issues)`
      : `Health check failed with status ${response.status}`,
    responseTime: response.responseTime,
    details: {
      api_status: response.data?.api_status,
      issues: response.data?.diagnostics?.issues,
      recommendations: response.data?.diagnostics?.recommendations
    }
  };
}

async function testAuthHealth() {
  const response = await makeRequest('GET', '/auth/health');
  
  return {
    success: response.status === 200 && response.data?.success === true,
    message: response.status === 200 
      ? `Auth health: ${response.data?.message || 'unknown'}`
      : `Expected 200, got ${response.status}`,
    responseTime: response.responseTime,
    details: response.data
  };
}

async function testGoogleOAuth() {
  const response = await makeRequest('GET', '/auth/google');
  
  // OAuth should redirect (302) to Google
  return {
    success: response.status === 302,
    message: response.status === 302 
      ? 'OAuth redirect working'
      : `Expected 302 redirect, got ${response.status}`,
    responseTime: response.responseTime,
    details: { location: response.headers?.location }
  };
}

async function testChatWithoutAuth() {
  const response = await makeRequest('POST', '/chat', { message: 'Hello' });
  
  // Should require authentication
  return {
    success: response.status === 401,
    message: response.status === 401 
      ? 'Authentication properly required'
      : `Expected 401, got ${response.status}`,
    responseTime: response.responseTime,
    details: response.data
  };
}

async function testInvalidChatRequest() {
  const response = await makeRequest('POST', '/chat', { invalid: 'data' });
  
  // Should return validation error
  return {
    success: response.status === 400 || response.status === 401,
    message: response.status === 400 
      ? 'Validation working properly'
      : response.status === 401
      ? 'Authentication required (expected)'
      : `Expected 400/401, got ${response.status}`,
    responseTime: response.responseTime,
    details: response.data
  };
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting AgentCraft API Tests');
  console.log('=====================================');
  
  // Core API tests
  await runTest('API Root Health', testApiRoot);
  await runTest('System Status', testApiStatus);
  await runTest('Debug Routes', testDebugRoutes);
  await runTest('Swagger Documentation', testSwaggerDocs);
  
  // Chat service tests
  await runTest('Chat Test Endpoint', testChatTest);
  await runTest('Chat Health Check', testChatHealth);
  
  // Authentication tests
  await runTest('Auth Health Check', testAuthHealth);
  await runTest('Google OAuth Redirect', testGoogleOAuth);
  
  // Security tests
  await runTest('Chat Without Authentication', testChatWithoutAuth);
  await runTest('Invalid Chat Request', testInvalidChatRequest);
  
  // Final report
  console.log('\n📊 Test Results Summary');
  console.log('=========================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  // Detailed results
  console.log('\n📝 Detailed Results:');
  results.tests.forEach(test => {
    const icon = test.success ? '✅' : '❌';
    console.log(`${icon} ${test.name}: ${test.message} (${test.responseTime}ms)`);
    
    if (!test.success && test.details) {
      console.log(`   Details:`, test.details);
    }
  });
  
  // Recommendations
  const failedTests = results.tests.filter(t => !t.success);
  if (failedTests.length > 0) {
    console.log('\n💡 Recommendations:');
    
    if (failedTests.some(t => t.name.includes('Chat Health'))) {
      console.log('- Check Hugging Face API configuration (.env file)');
      console.log('- Verify HF_API_KEY is valid and starts with "hf_"');
      console.log('- Run diagnostics endpoint: GET /api/chat/diagnostics');
    }
    
    if (failedTests.some(t => t.name.includes('Swagger'))) {
      console.log('- Check for YAML syntax errors in route documentation');
      console.log('- Verify swagger-ui-express is properly configured');
    }
    
    if (failedTests.some(t => t.name.includes('OAuth'))) {
      console.log('- Verify Google OAuth credentials in .env file');
      console.log('- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    }
  }
  
  console.log('\n🎯 AgentCraft API Tests Complete!');
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests, makeRequest, results }; 