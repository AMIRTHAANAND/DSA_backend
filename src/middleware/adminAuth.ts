<<<<<<< HEAD
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

interface AdminJwtPayload {
  adminId: string;
  type: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: any;
    }
  }
}

export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AdminJwtPayload;
      
      // Verify it's an admin token
      if (decoded.type !== 'admin') {
        res.status(401).json({
          success: false,
          message: 'Invalid token type. Admin access required.',
        });
        return;
      }

      // Get admin from database
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.adminId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isApproved: true,
        }
      });

      if (!admin) {
        res.status(401).json({
          success: false,
          message: 'Invalid token. Admin not found.',
        });
        return;
      }

      if (!admin.isApproved) {
        res.status(401).json({
          success: false,
          message: 'Admin account not approved.',
        });
        return;
      }

      req.admin = admin;
      next();
    } catch (jwtError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
      return;
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

// Middleware to check if admin is super admin
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.admin) {
    res.status(401).json({
      success: false,
      message: 'Admin authentication required.',
    });
    return;
  }

  if (req.admin.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Super admin role required.',
    });
    return;
  }

  next();
};
=======
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
    
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
