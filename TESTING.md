# Chat API Testing Guide

## Quick Setup

1. **Set Environment Variables**:
   ```bash
   # Copy and configure environment
   cp env.example .env
   
   # Add your Hugging Face API key
   HF_API_KEY=your-hugging-face-api-key
   ```

2. **Start the Server**:
   ```bash
   pnpm run dev
   ```

3. **Verify Health Check**:
   ```bash
   curl http://localhost:3000/api/chat/health
   ```

## Manual Testing with cURL

### 1. Health Check (No Auth Required)
```bash
curl -X GET http://localhost:3000/api/chat/health \
  -H "Content-Type: application/json"
```

Expected Response:
```json
{
  "success": true,
  "message": "Chat service is healthy",
  "model": "microsoft/DialoGPT-medium",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Chat Request (Requires Authentication)

First, you need to authenticate via Google OAuth:
1. Visit: `http://localhost:3000/api/auth/google`
2. Complete OAuth flow
3. Get JWT cookie from browser

Then test with valid session:
```bash
# Replace COOKIE_VALUE with actual JWT cookie from browser
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=COOKIE_VALUE" \
  -d '{"prompt": "Tell me a joke about developers"}'
```

Expected Response:
```json
{
  "answer": "Why did the developer go broke? Because he used up all his cache.",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "model": "microsoft/DialoGPT-medium",
  "usage": {
    "prompt_tokens": 7,
    "completion_tokens": 15,
    "total_tokens": 22
  }
}
```

### 3. Unauthenticated Request (Should Fail)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test"}'
```

Expected Response (401):
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

### 4. Invalid Request (Should Fail)
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=COOKIE_VALUE" \
  -d '{"prompt": ""}'
```

Expected Response (400):
```json
{
  "success": false,
  "error": "Invalid request data",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "prompt",
      "message": "Prompt cannot be empty"
    }
  ]
}
```

## Testing with Postman

### 1. Create Collection
- Import the following collection:

```json
{
  "info": {
    "name": "AgentCraft Chat API",
    "description": "Testing the chat endpoints"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": "{{baseUrl}}/api/chat/health"
      }
    },
    {
      "name": "Chat Request",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"prompt\": \"Explain quantum computing in simple terms\"\n}"
        },
        "url": "{{baseUrl}}/api/chat"
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    }
  ]
}
```

### 2. Authentication Setup
1. Go to `{{baseUrl}}/api/auth/google` in browser
2. Complete OAuth flow
3. Copy `authToken` cookie from browser dev tools
4. Add to Postman headers: `Cookie: authToken=YOUR_TOKEN`

## Testing with JavaScript (Browser Console)

After authenticating via the web interface:

```javascript
// Test basic chat
fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    prompt: 'What is the meaning of life?'
  })
})
.then(response => response.json())
.then(data => console.log('Chat response:', data))
.catch(error => console.error('Error:', error));

// Test health check
fetch('/api/chat/health')
.then(response => response.json())
.then(data => console.log('Health:', data));

// Test validation error
fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    prompt: ''
  })
})
.then(response => response.json())
.then(data => console.log('Validation error:', data));
```

## Error Testing

### Test Various Error Conditions:

1. **Empty Prompt**:
   ```json
   {"prompt": ""}
   ```

2. **Long Prompt** (>2000 chars):
   ```json
   {"prompt": "a".repeat(2001)}
   ```

3. **Missing Prompt**:
   ```json
   {}
   ```

4. **Invalid JSON**:
   ```
   {"prompt": "test"
   ```

5. **Wrong Content-Type**:
   ```bash
   curl -X POST http://localhost:3000/api/chat \
     -H "Content-Type: text/plain" \
     -d "test"
   ```

## Performance Testing

### Load Testing with curl
```bash
# Test multiple rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -H "Cookie: authToken=COOKIE_VALUE" \
    -d '{"prompt": "Test request '$i'"}' &
done
wait
```

### Response Time Testing
```bash
# Measure response time
time curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=COOKIE_VALUE" \
  -d '{"prompt": "Tell me a short story"}'
```

## Admin Endpoints Testing

Only accessible to admin users:

### Get Configuration
```bash
curl -X GET http://localhost:3000/api/chat/config \
  -H "Cookie: authToken=ADMIN_COOKIE"
```

### Update Configuration
```bash
curl -X PUT http://localhost:3000/api/chat/config \
  -H "Content-Type: application/json" \
  -H "Cookie: authToken=ADMIN_COOKIE" \
  -d '{
    "config": {
      "temperature": 0.8,
      "maxLength": 600
    }
  }'
```

## Common Issues & Solutions

### 401 Unauthorized
- **Issue**: Not authenticated
- **Solution**: Complete OAuth flow first

### 503 Service Unavailable
- **Issue**: Invalid Hugging Face API key
- **Solution**: Check HF_API_KEY in .env

### Model Loading Errors
- **Issue**: Model is cold starting
- **Solution**: Wait and retry (first request may take 30+ seconds)

### CORS Errors
- **Issue**: Frontend can't reach API
- **Solution**: Check CLIENT_URL in .env matches frontend URL

## Monitoring

Check server logs for:
- Response times
- Error patterns
- User activity
- API usage statistics

Example log output:
```
Chat API call - User: user123, Response time: 2500ms
Chat request completed - User: user123, Time: 2500ms
Chat request failed - Time: 1200ms, Error: Rate limit exceeded
``` 