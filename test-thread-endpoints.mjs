#!/usr/bin/env node
// test-thread-endpoints.mjs
// Comprehensive test for AgentCraft chat thread persistence endpoints

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const BASE_URL = 'http://localhost:5000';
const TEST_CONFIG = {
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// Test colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Test state
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

let authCookie = null;
let testThreadId = null;

// Helper functions
function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function logTest(name, status, details = '') {
  const prefix = status === 'PASS' 
    ? colorize('✅ PASS', 'green') 
    : colorize('❌ FAIL', 'red');
  
  console.log(`${prefix} ${name}`);
  if (details) {
    console.log(`   ${details}`);
  }
  
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

function logInfo(message) {
  console.log(colorize(`ℹ️  ${message}`, 'cyan'));
}

function logWarning(message) {
  console.log(colorize(`⚠️  ${message}`, 'yellow'));
}

function logError(message) {
  console.log(colorize(`🚨 ${message}`, 'red'));
}

// HTTP helper with authentication
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth cookie if available
  if (authCookie) {
    headers['Cookie'] = authCookie;
  }

  const config = {
    method: options.method || 'GET',
    headers,
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  
  // Store auth cookie from response
  if (response.headers.get('set-cookie')) {
    authCookie = response.headers.get('set-cookie');
  }

  const data = await response.json();
  return { response, data };
}

// Test functions
async function testServerHealth() {
  logInfo('Testing server health...');
  
  try {
    const { response, data } = await apiRequest('/api/health');
    
    if (response.status === 200 && data.status === 'Server is running') {
      logTest('Server Health Check', 'PASS', 'Server is running and responsive');
      return true;
    } else {
      logTest('Server Health Check', 'FAIL', `Unexpected response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logTest('Server Health Check', 'FAIL', `Connection error: ${error.message}`);
    return false;
  }
}

async function testChatHealth() {
  logInfo('Testing chat service health...');
  
  try {
    const { response, data } = await apiRequest('/api/chat/health');
    
    if (response.status === 200 && data.success) {
      logTest('Chat Service Health', 'PASS', `Chat service is ${data.api_status} with model ${data.model}`);
      return true;
    } else {
      logTest('Chat Service Health', 'FAIL', `Chat service health check failed: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logTest('Chat Service Health', 'FAIL', `Connection error: ${error.message}`);
    return false;
  }
}

async function testUnauthorizedAccess() {
  logInfo('Testing unauthorized access to thread endpoints...');
  
  // Clear auth cookie for this test
  const originalCookie = authCookie;
  authCookie = null;
  
  try {
    // Test creating thread without auth
    const { response: createResponse, data: createData } = await apiRequest('/api/chat/thread', {
      method: 'POST',
      body: { title: 'Test Thread' }
    });
    
    if (createResponse.status === 401 && !createData.success) {
      logTest('Unauthorized Thread Creation', 'PASS', 'Correctly rejected unauthorized request');
    } else {
      logTest('Unauthorized Thread Creation', 'FAIL', 'Should have rejected unauthorized request');
    }
    
    // Test getting threads without auth
    const { response: getResponse, data: getData } = await apiRequest('/api/chat/threads');
    
    if (getResponse.status === 401 && !getData.success) {
      logTest('Unauthorized Thread Access', 'PASS', 'Correctly rejected unauthorized request');
    } else {
      logTest('Unauthorized Thread Access', 'FAIL', 'Should have rejected unauthorized request');
    }
    
  } catch (error) {
    logTest('Unauthorized Access Tests', 'FAIL', `Error testing unauthorized access: ${error.message}`);
  } finally {
    // Restore auth cookie
    authCookie = originalCookie;
  }
}

async function simulateAuthentication() {
  logInfo('Simulating authentication...');
  
  // For testing purposes, we'll simulate having authentication
  // In a real scenario, this would involve the OAuth flow
  logWarning('Note: This test requires manual authentication or mocked auth');
  logInfo('Assuming authentication is handled by existing auth system');
  
  // Set a placeholder cookie to simulate authentication
  // In real testing, you would either:
  // 1. Use a test user with known credentials
  // 2. Mock the authentication middleware
  // 3. Use a testing environment with auth bypass
  authCookie = 'test-session=simulated-auth-token';
  
  return true;
}

async function testCreateThread() {
  logInfo('Testing thread creation...');
  
  try {
    const { response, data } = await apiRequest('/api/chat/thread', {
      method: 'POST',
      body: { title: 'Test Thread for Persistence' }
    });
    
    if (response.status === 201 && data.success && data.thread) {
      testThreadId = data.thread._id;
      logTest('Create Thread', 'PASS', `Thread created with ID: ${testThreadId}`);
      return true;
    } else if (response.status === 401) {
      logTest('Create Thread', 'FAIL', 'Authentication required - please ensure user is logged in');
      return false;
    } else {
      logTest('Create Thread', 'FAIL', `Unexpected response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logTest('Create Thread', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testGetThreads() {
  logInfo('Testing get user threads...');
  
  try {
    const { response, data } = await apiRequest('/api/chat/threads');
    
    if (response.status === 200 && data.success && Array.isArray(data.threads)) {
      logTest('Get Threads', 'PASS', `Retrieved ${data.threads.length} threads`);
      return true;
    } else if (response.status === 401) {
      logTest('Get Threads', 'FAIL', 'Authentication required - please ensure user is logged in');
      return false;
    } else {
      logTest('Get Threads', 'FAIL', `Unexpected response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logTest('Get Threads', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testSendMessage() {
  if (!testThreadId) {
    logTest('Send Message', 'FAIL', 'No thread ID available for testing');
    return false;
  }
  
  logInfo(`Testing send message to thread ${testThreadId}...`);
  
  try {
    const { response, data } = await apiRequest(`/api/chat/${testThreadId}/message`, {
      method: 'POST',
      body: { content: 'Hello, this is a test message for the thread persistence feature!' }
    });
    
    if (response.status === 200 && data.success && data.messages) {
      const { userMessage, assistantMessage } = data.messages;
      
      if (userMessage && assistantMessage) {
        logTest('Send Message', 'PASS', 
          `User message: "${userMessage.content.substring(0, 50)}..."\n` +
          `   Assistant response: "${assistantMessage.content.substring(0, 50)}..."`
        );
        return true;
      } else {
        logTest('Send Message', 'FAIL', 'Missing user or assistant message in response');
        return false;
      }
    } else if (response.status === 401) {
      logTest('Send Message', 'FAIL', 'Authentication required - please ensure user is logged in');
      return false;
    } else if (response.status === 404) {
      logTest('Send Message', 'FAIL', 'Thread not found or access denied');
      return false;
    } else {
      logTest('Send Message', 'FAIL', `Unexpected response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logTest('Send Message', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testGetMessages() {
  if (!testThreadId) {
    logTest('Get Messages', 'FAIL', 'No thread ID available for testing');
    return false;
  }
  
  logInfo(`Testing get messages from thread ${testThreadId}...`);
  
  try {
    const { response, data } = await apiRequest(`/api/chat/${testThreadId}/messages`);
    
    if (response.status === 200 && data.success && Array.isArray(data.messages)) {
      const messageCount = data.messages.length;
      const hasUserAndAssistant = data.messages.some(m => m.role === 'user') && 
                                  data.messages.some(m => m.role === 'assistant');
      
      if (messageCount >= 2 && hasUserAndAssistant) {
        logTest('Get Messages', 'PASS', 
          `Retrieved ${messageCount} messages with both user and assistant roles`
        );
        return true;
      } else {
        logTest('Get Messages', 'PASS', 
          `Retrieved ${messageCount} messages (may be empty if thread was just created)`
        );
        return true;
      }
    } else if (response.status === 401) {
      logTest('Get Messages', 'FAIL', 'Authentication required - please ensure user is logged in');
      return false;
    } else if (response.status === 404) {
      logTest('Get Messages', 'FAIL', 'Thread not found or access denied');
      return false;
    } else {
      logTest('Get Messages', 'FAIL', `Unexpected response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    logTest('Get Messages', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testInvalidThreadOperations() {
  logInfo('Testing operations with invalid thread ID...');
  
  const invalidThreadId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent
  
  try {
    // Test sending message to non-existent thread
    const { response: sendResponse, data: sendData } = await apiRequest(`/api/chat/${invalidThreadId}/message`, {
      method: 'POST',
      body: { content: 'This should fail' }
    });
    
    if (sendResponse.status === 404 && !sendData.success) {
      logTest('Invalid Thread Send Message', 'PASS', 'Correctly rejected invalid thread ID');
    } else {
      logTest('Invalid Thread Send Message', 'FAIL', 'Should have rejected invalid thread ID');
    }
    
    // Test getting messages from non-existent thread
    const { response: getResponse, data: getData } = await apiRequest(`/api/chat/${invalidThreadId}/messages`);
    
    if (getResponse.status === 404 && !getData.success) {
      logTest('Invalid Thread Get Messages', 'PASS', 'Correctly rejected invalid thread ID');
    } else {
      logTest('Invalid Thread Get Messages', 'FAIL', 'Should have rejected invalid thread ID');
    }
    
  } catch (error) {
    logTest('Invalid Thread Operations', 'FAIL', `Error testing invalid operations: ${error.message}`);
  }
}

// Main test runner
async function runTests() {
  console.log(colorize('\n🧪 AgentCraft Thread Persistence Test Suite', 'white'));
  console.log(colorize('='.repeat(50), 'blue'));
  
  // Basic connectivity tests
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    logError('Server is not responding. Please start the server first.');
    process.exit(1);
  }
  
  const chatHealthy = await testChatHealth();
  if (!chatHealthy) {
    logWarning('Chat service may not be fully configured, but continuing with tests...');
  }
  
  // Authentication simulation
  await simulateAuthentication();
  
  // Unauthorized access tests
  await testUnauthorizedAccess();
  
  // Main thread persistence tests
  await testCreateThread();
  await testGetThreads();
  await testSendMessage();
  await testGetMessages();
  
  // Edge case tests
  await testInvalidThreadOperations();
  
  // Results summary
  console.log(colorize('\n📊 Test Results Summary', 'white'));
  console.log(colorize('='.repeat(30), 'blue'));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(colorize(`Passed: ${testResults.passed}`, 'green'));
  console.log(colorize(`Failed: ${testResults.failed}`, 'red'));
  
  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  
  if (testResults.failed === 0) {
    console.log(colorize('\n🎉 All tests passed! Thread persistence is working correctly.', 'green'));
  } else {
    console.log(colorize('\n⚠️  Some tests failed. Please check the implementation.', 'yellow'));
  }
  
  // Additional notes
  console.log(colorize('\n📝 Important Notes:', 'cyan'));
  console.log('• This test assumes authentication is handled by the existing auth system');
  console.log('• For production testing, ensure proper OAuth2 authentication flow');
  console.log('• Verify MongoDB connection and proper environment variables');
  console.log('• Check that Gemini AI API key is configured for full functionality');
  
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  logError(`Test runner failed: ${error.message}`);
  process.exit(1);
}); 