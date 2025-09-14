import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { loadEnv } from '../config/env';
import { sendLoginEmail, sendAdminNotification, sendUserApprovalEmail } from '../../services/emailService';

const prisma = new PrismaClient();
const env = loadEnv();
export const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['STUDENT', 'INSTRUCTOR', 'ADMIN']).default('STUDENT')
});

router.post('/register', async (req, res) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    
    const { email, password, username, firstName, lastName, role } = parse.data;
    
    // Check if user already exists
    const existing = await prisma.user.findFirst({ 
      where: { 
        OR: [
          { email },
          { username }
        ]
      } 
    });
    if (existing) {
      return res.status(409).json({ 
        error: existing.email === email ? 'Email already in use' : 'Username already taken'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isAdmin = role === 'ADMIN';
    
    const user = await prisma.user.create({ 
      data: { 
        email, 
        password: passwordHash, 
        username,
        firstName,
        lastName,
        role: role as UserRole, 
        isApproved: false 
      } 
    });

    // 🔔 Send appropriate notification emails
    try {
      if (isAdmin) {
        // Send notification to super admin for admin approval
        await sendAdminNotification(user);
        console.log('✅ Admin notification email sent to super admin');
      } else {
        // Send welcome email to user (they need approval)
        await sendUserApprovalEmail(user.email, `${user.firstName} ${user.lastName}`);
        console.log('✅ User welcome email sent');
      }
    } catch (emailError) {
      console.error('❌ Failed to send registration email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({ 
      message: 'Registration received. Awaiting approval via email.',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const loginSchema = z.object({ 
  email: z.string().email(), 
  password: z.string().min(6) 
});

router.post('/login', async (req, res) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    
    const { email, password } = parse.data;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (!user.isApproved) return res.status(403).json({ error: 'Account not approved yet' });
    if (!user.isActive) return res.status(403).json({ error: 'Account is deactivated' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user.id, role: user.role }, 
      env.JWT_SECRET || 'dev_secret', 
      { expiresIn: env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // 🔔 Send login notification email
    try {
      await sendLoginEmail(user.email);
      console.log('✅ Login notification email sent');
    } catch (emailError) {
      console.error('❌ Failed to send login notification email:', emailError);
      // Don't fail login if email fails
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isApproved: user.isApproved
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manual approval endpoint for super admin
router.post('/approve/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (user.isApproved) return res.status(400).json({ error: 'User already approved' });

    await prisma.user.update({ 
      where: { id: userId }, 
      data: { isApproved: true } 
    });

    // 🔔 Send approval email to user
    try {
      await sendUserApprovalEmail(user.email, `${user.firstName} ${user.lastName}`);
      console.log('✅ User approval email sent');
    } catch (emailError) {
      console.error('❌ Failed to send approval email:', emailError);
    }

    res.json({ message: 'User approved successfully' });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

