import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { loadEnv } from '../config/env';
import { mailer } from '../services/mailer';
import crypto from 'crypto';

const prisma = new PrismaClient();
const env = loadEnv();
export const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'USER']).default('USER')
});

router.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { email, password, name, role } = parse.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 10);
  const isAdmin = role === 'ADMIN';
  const user = await prisma.user.create({ data: { email, passwordHash, name, role: isAdmin ? Role.ADMIN : Role.USER, isApproved: false } });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await prisma.approvalToken.create({ data: { userId: user.id, token, type: isAdmin ? 'ADMIN_APPROVAL' : 'USER_APPROVAL', expiresAt } });

  const approveLink = `${req.protocol}://${req.get('host')}/auth/approve?token=${token}`;
  const to = isAdmin ? env.SUPER_ADMIN_EMAIL : undefined;
  const subject = isAdmin ? 'Admin approval required' : 'User approval required';
  const recipient = isAdmin ? to : undefined;
  try {
    await mailer.sendMail({
      to: recipient || email,
      subject,
      html: isAdmin
        ? `Approve new admin ${email}: <a href="${approveLink}">Approve</a>`
        : `Approve new user ${email}: <a href="${approveLink}">Approve</a>`
    });
  } catch (e) {
    // ignore email errors in dev
  }

  res.status(201).json({ message: 'Registration received. Await approval via email.' });
});

router.get('/approve', async (req, res) => {
  const token = String(req.query.token || '');
  if (!token) return res.status(400).json({ error: 'Missing token' });
  const record = await prisma.approvalToken.findUnique({ where: { token }, include: { user: true } });
  if (!record) return res.status(404).json({ error: 'Invalid token' });
  if (record.expiresAt.getTime() < Date.now()) return res.status(400).json({ error: 'Token expired' });

  await prisma.user.update({ where: { id: record.userId }, data: { isApproved: true } });
  await prisma.approvalToken.delete({ where: { id: record.id } });
  res.json({ message: 'Account approved. You can now log in.' });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
router.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  const { email, password } = parse.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.isApproved) return res.status(403).json({ error: 'Account not approved' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET || 'dev_secret', { expiresIn: env.JWT_EXPIRES_IN || '7d' });
  await prisma.loginEvent.create({ data: { userId: user.id, ip: req.ip, userAgent: req.get('user-agent') || undefined } });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

export default router;

