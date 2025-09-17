import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import prisma from '../config/database';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/', [protect, authorize('admin')], async (req: express.Request, res: express.Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLogin: true
      },
      orderBy: { lastLogin: 'desc' }
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Server error while fetching users' });
  }
});
// @route   PUT /api/users/profile
// @desc    Update current user profile
// @access  Private
router.put(
  '/profile',
  [
    protect,
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters')
  ],
  async (req: AuthRequest, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { firstName, lastName, bio } = req.body;
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (bio !== undefined) updateData.bio = bio;

      const user = await prisma.user.update({
        where: { id: req.user!.id },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          bio: true,
          role: true,
          isActive: true
        }
      });

      res.json({ success: true, message: 'Profile updated successfully', data: user });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ success: false, error: 'Server error while updating profile' });
    }
  }
);

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put(
  '/password',
  [
    protect,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ],
  async (req: AuthRequest, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { currentPassword, newPassword } = req.body;
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          username: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true
        }
      });
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });

      const isMatch = await bcrypt.compare(currentPassword, user.password || '');
      if (!isMatch) return res.status(400).json({ success: false, error: 'Current password is incorrect' });

      const newHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { password: newHash }
      });

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, error: 'Server error while changing password' });
    }
  }
);

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin only)
router.get('/', [protect, authorize('admin')], async (req: express.Request, res: express.Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Server error while fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private (Admin only)
router.get('/:id', [protect, authorize('admin')], async (req: express.Request, res: express.Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Server error while fetching user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user by ID (Admin only)
// @access  Private (Admin only)
router.put(
  '/:id',
  [
    protect,
    authorize('admin'),
    body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    body('role').optional().isIn(['student', 'admin', 'instructor']).withMessage('Invalid role'),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
  ],
  async (req: AuthRequest, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.params.id }
      });
      if (!user) return res.status(404).json({ success: false, error: 'User not found' });

      const updatedUser = await prisma.user.update({
        where: { id: req.params.id },
        data: req.body,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true
        }
      });

      res.json({ success: true, message: 'User updated successfully', data: updatedUser });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ success: false, error: 'Server error while updating user' });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete user by ID (Admin only)
// @access  Private (Admin only)
router.delete('/:id', [protect, authorize('admin')], async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Server error while deleting user' });
  }
});

// @route   PATCH /api/users/:id/status
// @desc    Toggle user active status (Admin only)
// @access  Private (Admin only)
router.patch('/:id/status', [protect, authorize('admin')], async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.id === req.user!.id) {
      return res.status(400).json({ success: false, error: 'Cannot deactivate your own account' });
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive }
    });

    res.json({
      success: true,
      message: `User ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: updated.isActive }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ success: false, error: 'Server error while toggling user status' });
  }
});

export default router;
