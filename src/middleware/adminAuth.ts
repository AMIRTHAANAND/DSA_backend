import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface JwtPayload {
  id: string;
  role: string;
}

// Middleware to protect admin routes
export const protectAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;

    // Only superadmins should be able to approve admins
    if (req.path.includes('approve') && decoded.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can approve admins' });
    }

    // attach decoded admin info to request
    (req as any).admin = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token failed or invalid' });
  }
};
    