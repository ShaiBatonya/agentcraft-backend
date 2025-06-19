# Authentication System

A complete Google OAuth2 authentication system with JWT tokens and httpOnly cookies.

## Features

- ✅ Google OAuth2 integration
- ✅ JWT token generation and verification
- ✅ Secure httpOnly cookies
- ✅ User management with MongoDB
- ✅ Role-based access control
- ✅ TypeScript support
- ✅ Modular architecture

## Architecture

```
features/auth/
├── auth.controller.ts     # Route handlers
├── auth.routes.ts         # Express routes
├── auth.service.ts        # Business logic
├── auth.types.ts          # TypeScript interfaces
└── README.md             # This file

models/
└── User.ts               # User MongoDB schema

middlewares/
└── authGuard.ts          # Authentication middleware

utils/
└── jwt.ts                # JWT utilities

config/
├── passport.ts           # Passport configuration
└── validateEnv.ts        # Environment validation

types/
└── express.d.ts          # Express type extensions
```

## API Endpoints

### Authentication Routes

#### `GET /api/auth/google`
- **Description**: Initiate Google OAuth flow
- **Access**: Public
- **Response**: Redirects to Google OAuth

#### `GET /api/auth/google/callback`
- **Description**: Handle Google OAuth callback
- **Access**: Public
- **Response**: Sets JWT cookie and redirects to `/chat`

#### `GET /api/auth/me`
- **Description**: Get current user information
- **Access**: Private (requires JWT cookie)
- **Response**: 
  ```json
  {
    "success": true,
    "user": {
      "id": "user_id",
      "googleId": "google_id",
      "email": "user@example.com",
      "name": "John Doe",
      "avatar": "https://avatar-url.com",
      "role": "user"
    }
  }
  ```

#### `POST /api/auth/logout`
- **Description**: Logout user and clear JWT cookie
- **Access**: Private (requires JWT cookie)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully"
  }
  ```

#### `GET /api/auth/health`
- **Description**: Auth system health check
- **Access**: Public (shows auth status if logged in)
- **Response**:
  ```json
  {
    "success": true,
    "message": "Auth system is running",
    "authenticated": true
  }
  ```

## Environment Variables

Required environment variables (see `env.example`):

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Client Configuration
CLIENT_URL=http://localhost:5173

# Server Configuration
NODE_ENV=development
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`

## Middleware Usage

### Protect Routes

```typescript
import { authGuard } from '../middlewares/authGuard.js';

// Require authentication
router.get('/protected', authGuard, (req, res) => {
  // req.user is available and typed
  res.json({ user: req.user });
});
```

### Optional Authentication

```typescript
import { optionalAuth } from '../middlewares/authGuard.js';

// Optional authentication
router.get('/public', optionalAuth, (req, res) => {
  // req.user may or may not be present
  if (req.user) {
    res.json({ message: 'Hello authenticated user!' });
  } else {
    res.json({ message: 'Hello anonymous user!' });
  }
});
```

### Admin Only

```typescript
import { adminGuard } from '../middlewares/authGuard.js';

// Require admin role
router.get('/admin', adminGuard, (req, res) => {
  // req.user is guaranteed to be admin
  res.json({ message: 'Admin area' });
});
```

## JWT Configuration

- **Algorithm**: HS256
- **Expiration**: 1 day
- **Cookie Settings**:
  - `httpOnly: true` (prevents XSS)
  - `secure: true` (HTTPS only in production)
  - `sameSite: 'none'` (production) or `'lax'` (development)
  - `maxAge: 24 hours`

## Security Features

- ✅ httpOnly cookies prevent XSS attacks
- ✅ CSRF protection via SameSite cookies
- ✅ Secure cookies in production (HTTPS only)
- ✅ JWT secret validation (min 32 characters)
- ✅ User input validation with Zod
- ✅ Role-based access control

## Error Handling

The system provides detailed error responses:

```json
{
  "success": false,
  "message": "Access denied. No authentication token provided."
}
```

Common error scenarios:
- Missing JWT token
- Invalid/expired JWT token
- User not found
- Insufficient permissions
- Google OAuth errors

## Type Safety

The system includes comprehensive TypeScript types:

```typescript
interface AuthenticatedUser {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
}
```

Express Request is extended to include user:

```typescript
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
``` 