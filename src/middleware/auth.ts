import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

interface JwtPayload {
  // Some tokens in the codebase are generated as { id }, others as { userId }
  id?: string;
  userId?: string;
}

export interface AuthRequest extends Request {
  user?: any;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      // Support both { id } and { userId } payloads
      const decodedUserId = decoded.userId || decoded.id;

      if (!decodedUserId) {
        res.status(401).json({
          success: false,
          message: 'Invalid token payload.',
        });
        return;
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decodedUserId },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid token. User not found.',
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          message: 'Account is deactivated.',
        });
        return;
      }

      req.user = user;
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

// Alias for compatibility
export const protect = authenticate;

// Middleware to check if user is admin or instructor
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'INSTRUCTOR') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin or instructor role required.',
    });
    return;
  }

  next();
};

// Middleware to check if user is instructor
export const requireInstructor = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (req.user.role !== 'INSTRUCTOR' && req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Instructor role required.',
    });
    return;
  }

  next();
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      const decodedUserId = decoded.userId || decoded.id;
      if (!decodedUserId) {
        next();
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: decodedUserId },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (jwtError) {
      // Invalid token, but we don't fail - just continue without user
    }

    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    next();
  }
};