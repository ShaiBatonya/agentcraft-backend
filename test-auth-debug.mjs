// Test script to debug authentication issue
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Create a test user token for debugging
const testPayload = {
  userId: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  role: 'user'
};

async function testAuthEndpoints() {
  console.log('🔍 Testing authentication endpoints...\n');

  try {
    // Test auth health endpoint (should work without auth)
    console.log('1. Testing /api/auth/health (no auth required)');
    const healthResponse = await axios.get(`${BASE_URL}/api/auth/health`);
    console.log('✅ Health check:', healthResponse.status, healthResponse.data);
  } catch (error) {
    console.log('❌ Health check failed:', error.response?.status, error.response?.data || error.message);
  }

  try {
    // Test auth/me endpoint without cookie (should fail)
    console.log('\n2. Testing /api/auth/me (no cookie - should fail)');
    const meResponse = await axios.get(`${BASE_URL}/api/auth/me`);
    console.log('❌ Unexpected success:', meResponse.status, meResponse.data);
  } catch (error) {
    console.log('✅ Expected 401:', error.response?.status, error.response?.data?.message);
  }

  try {
    // Test chat history endpoint without cookie (should fail)
    console.log('\n3. Testing /api/chat/history (no cookie - should fail)');
    const historyResponse = await axios.get(`${BASE_URL}/api/chat/history`);
    console.log('❌ Unexpected success:', historyResponse.status, historyResponse.data);
  } catch (error) {
    console.log('✅ Expected 401:', error.response?.status, error.response?.data?.message);
  }

  // Test with fake cookie
  console.log('\n4. Testing with fake cookie (should fail)');
  const axiosWithCookie = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
      'Cookie': 'token=fake-token-here'
    }
  });

  try {
    const meResponse = await axiosWithCookie.get('/api/auth/me');
    console.log('❌ Unexpected success with fake cookie:', meResponse.status);
  } catch (error) {
    console.log('✅ Expected failure with fake cookie:', error.response?.status, error.response?.data?.message);
  }

  try {
    const historyResponse = await axiosWithCookie.get('/api/chat/history');
    console.log('❌ Unexpected success with fake cookie:', historyResponse.status);
  } catch (error) {
    console.log('✅ Expected failure with fake cookie:', error.response?.status, error.response?.data?.message);
  }

  console.log('\n🔍 Debug complete. Both endpoints should behave the same way.');
  console.log('If /auth/me works but /chat/history fails with the same cookie, there\'s a routing issue.');
}

testAuthEndpoints().catch(console.error); 