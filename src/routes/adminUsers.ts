import express from 'express';
import prisma from '../config/database';
import { authenticateAdmin, requireAdminOrSuper } from '../middleware/adminAuth';
import { sendUserApprovalEmail } from '../services/emailService';

const router = express.Router();

// All routes require admin (ADMIN or SUPER_ADMIN)
router.use(authenticateAdmin, requireAdminOrSuper);

// GET /api/admin/users/pending - list users pending activation
router.get('/pending', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    res.json({ success: true, data: { users } });
  } catch (error) {
    console.error('List pending users error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// PUT /api/admin/users/approve/:id - activate user and notify them
router.put('/approve/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isActive) {
      return res.status(400).json({ success: true, message: 'User already active' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      }
    });

    // Send approval email (best-effort)
    try {
      await sendUserApprovalEmail(updated.email, updated.firstName || updated.username || 'User');
    } catch (e) {
      console.error('sendUserApprovalEmail failed:', e);
    }

    res.json({ success: true, message: 'User approved successfully', data: { user: updated } });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// DELETE /api/admin/users/reject/:id - optional: delete a pending user
router.delete('/reject/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isActive) {
      return res.status(400).json({ success: false, message: 'Cannot reject an already active user' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User registration rejected and removed' });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
