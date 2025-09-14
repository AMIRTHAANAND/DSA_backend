import { Router } from 'express';
import { PrismaClient, UserRole, AdminRole } from '@prisma/client';
import { authenticateJWT, requireRole } from '../security/auth.middleware';

const prisma = new PrismaClient();
export const router = Router();

router.use(authenticateJWT);

router.get('/logins', requireRole([UserRole.ADMIN, AdminRole.SUPER_ADMIN]), async (_req, res) => {
  const events = await prisma.loginEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { user: true } });
  res.json(events.map(e => ({ id: e.id, email: e.user.email, role: e.user.role, ip: e.ip, userAgent: e.userAgent, createdAt: e.createdAt })));
});

router.get('/pending', requireRole([UserRole.ADMIN, AdminRole.SUPER_ADMIN]), async (_req, res) => {
  const users = await prisma.user.findMany({ where: { isApproved: false } });
  res.json(users);
});

router.post('/approve/:userId', requireRole([UserRole.ADMIN, AdminRole.SUPER_ADMIN]), async (req, res) => {
  const { userId } = req.params;
  await prisma.user.update({ where: { id: userId }, data: { isApproved: true } });
  res.json({ ok: true });
});

export default router;

