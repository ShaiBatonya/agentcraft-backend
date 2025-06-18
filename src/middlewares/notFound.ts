// notFound.ts
// Express middleware for handling 404 Not Found errors.

import { Request, Response, NextFunction } from 'express';

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({ message: 'Not Found' });
} 