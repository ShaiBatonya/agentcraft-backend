# Chat Feature - Modular Architecture

## Overview

The Chat feature provides AI-powered conversational capabilities using the Hugging Face Inference API with a clean, modular architecture following separation of concerns principles.

## 🏗️ Architecture Layers

```
src/features/chat/
├── routes/
│   └── chat.routes.ts        # Route definitions & middleware application
├── controllers/
│   └── chat.controller.ts    # HTTP request/response handling
├── services/
│   └── chat.service.ts       # Business logic & external API integration
├── validators/
│   └── chat.schema.ts        # Zod validation schemas
├── types/
│   └── chat.types.ts         # TypeScript type definitions
└── README.md                 # This documentation
```

### 📍 Route Layer (`routes/chat.routes.ts`)
**Responsibility**: Define API endpoints and apply middleware
- Express Router configuration
- Middleware application (`authGuard`, `adminGuard`, `optionalAuth`)
- Route documentation with JSDoc comments
- Clean separation of endpoint definitions

### 🎮 Controller Layer (`controllers/chat.controller.ts`)
**Responsibility**: Handle HTTP requests and responses
- Request validation using Zod schemas
- Authentication checks
- Service layer orchestration
- Response formatting
- Error handling and status code mapping
- Performance logging

### 🔧 Service Layer (`services/chat.service.ts`)
**Responsibility**: Business logic and external integrations
- Hugging Face API integration
- Response processing and cleaning
- Configuration management
- Token estimation
- Error handling for external services
- Analytics and monitoring

### ✅ Validation Layer (`validators/chat.schema.ts`)
**Responsibility**: Input/output validation and type safety
- Zod schemas for all data structures
- Request validation (prompt: min 5 chars, max 2000 chars)
- Response validation
- Configuration validation
- Environment variable validation
- Type inference and exports

### 📝 Type Layer (`types/chat.types.ts`)
**Responsibility**: TypeScript type definitions
- Interface definitions for all data structures
- Request/Response types
- Service layer types
- API response types
- Analytics and monitoring types

## 🔗 API Endpoints

### `POST /api/chat`
**Purpose**: Send prompt to AI and get response  
**Authentication**: Required (JWT cookie: `token`)  
**Validation**: Prompt must be 5-2000 characters

**Request**:
```json
{
  "prompt": "Tell me about quantum computing"
}
```

**Response**:
```json
{
  "answer": "Quantum computing is a revolutionary technology...",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "model": "microsoft/DialoGPT-medium",
  "usage": {
    "prompt_tokens": 6,
    "completion_tokens": 45,
    "total_tokens": 51
  }
}
```

### `GET /api/chat/config`
**Purpose**: Get current chat configuration  
**Authentication**: Admin only

### `PUT /api/chat/config`
**Purpose**: Update chat configuration  
**Authentication**: Admin only

### `GET /api/chat/health`
**Purpose**: Service health check  
**Authentication**: Optional

## 🛡️ Security Features

### Authentication
- **JWT Cookie**: Uses httpOnly cookie named `token`
- **authGuard Middleware**: Validates authentication for protected routes
- **adminGuard Middleware**: Requires admin role for configuration endpoints
- **Role-based Access**: User/admin role separation

### Input Validation
- **Zod Schemas**: Comprehensive validation for all inputs
- **Length Limits**: Prompt: 5-2000 characters
- **Type Safety**: Full TypeScript coverage
- **Sanitization**: Input trimming and cleaning

### Error Handling
- **Structured Errors**: Consistent error response format
- **Status Code Mapping**: Appropriate HTTP status codes
- **Security**: No sensitive data exposure in errors
- **Logging**: Comprehensive error logging

## 🔧 Configuration

### Environment Variables
```env
HF_API_KEY=your-hugging-face-api-key
```

### Default Chat Config
```typescript
{
  model: 'microsoft/DialoGPT-medium',
  maxLength: 500,
  temperature: 0.7,
  topP: 0.9,
  doSample: true,
  returnFullText: false
}
```

## 📊 Usage Examples

### Frontend Integration
```javascript
// Send chat request
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include JWT cookie
  body: JSON.stringify({
    prompt: 'Explain machine learning in simple terms'
  })
});

const data = await response.json();
console.log('AI Response:', data.answer);
```

### Error Handling
```javascript
try {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ prompt: userInput })
  });

  if (!response.ok) {
    const error = await response.json();
    
    switch (response.status) {
      case 400:
        console.error('Validation error:', error.details);
        break;
      case 401:
        console.error('Please log in to continue');
        break;
      case 429:
        console.error('Rate limit exceeded');
        break;
      case 503:
        console.error('Service unavailable:', error.error);
        break;
      default:
        console.error('Unexpected error:', error.error);
    }
    return;
  }

  const data = await response.json();
  displayChatMessage(data.answer);
} catch (error) {
  console.error('Network error:', error);
}
```

## 🧪 Testing

### Manual Testing
```bash
# Health check (no auth required)
curl http://localhost:3000/api/chat/health

# Chat request (requires authentication)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{"prompt": "Hello, how are you?"}'
```

### Validation Testing
```bash
# Test minimum length validation (should fail)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{"prompt": "Hi"}'

# Test maximum length validation (should fail)
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{"prompt": "'$(printf 'a%.0s' {1..2001})'"}'
```

## 🔍 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Admin access required | 403 |
| `VALIDATION_ERROR` | Invalid input data | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `SERVICE_UNAVAILABLE` | HF API issues | 503 |
| `MODEL_LOADING` | Model initializing | 503 |
| `INTERNAL_ERROR` | Server error | 500 |
| `HEALTH_CHECK_FAILED` | Service unhealthy | 503 |

## 🚀 Production Considerations

### Performance
- **Response Time Logging**: All requests logged with timing
- **Token Estimation**: Rough usage tracking
- **Timeout Handling**: 30-second timeout for HF API
- **Error Recovery**: Graceful degradation on failures

### Monitoring
- **Health Checks**: Service availability monitoring
- **Analytics**: User activity and response time tracking
- **Error Tracking**: Comprehensive error logging
- **Usage Metrics**: Token usage estimation

### Scalability
- **Stateless Design**: No server-side session storage
- **Configurable**: Runtime configuration updates
- **Modular**: Easy to extend with new features
- **Type Safety**: Prevents runtime errors

## 📈 Future Enhancements

- **Conversation Memory**: Multi-turn conversations
- **Streaming Responses**: Real-time response streaming
- **Multiple Models**: User-selectable AI models
- **Rate Limiting**: User-based request limiting
- **Caching**: Response caching for common queries
- **Analytics Dashboard**: Usage statistics visualization 