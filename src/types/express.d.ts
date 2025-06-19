import { AuthenticatedUser } from '../features/auth/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
    
    interface User extends AuthenticatedUser {}
  }
}

export {}; 