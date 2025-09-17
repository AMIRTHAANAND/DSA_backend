import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/progress
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    let progress = await prisma.progress.findFirst({
      where: { userId: req.user.id },
      include: { topicProgress: true },
    });

    if (!progress) {
      progress = await prisma.progress.create({
        data: { userId: req.user.id },
        include: { topicProgress: true },
      });
      if (!progress.topicProgress) progress.topicProgress = [];
    }

    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ success: false, error: 'Server error while fetching progress' });
  }
});

// POST /api/progress/topic
router.post(
  '/topic',
  protect,
  body('topicId').notEmpty().withMessage('Topic ID is required'),
  body('status').isIn(['not-started', 'in-progress', 'completed']).withMessage('Invalid status'),
  body('timeSpent').optional().isInt({ min: 0 }).withMessage('Time spent must be non-negative'),
  async (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { topicId, status, timeSpent = 0 } = req.body;

    // ✅ Always cast to string because schema expects String
    const validTopicId: string = String(topicId);

    try {
      let progress = await prisma.progress.findFirst({
        where: { userId: req.user.id },
        include: { topicProgress: true },
      });

      if (!progress) {
        progress = await prisma.progress.create({
          data: { userId: req.user.id },
          include: { topicProgress: true },
        });
      }

      const mappedStatus = status === 'completed' ? 'COMPLETED' : status === 'in-progress' ? 'IN_PROGRESS' : 'NOT_STARTED';

      await prisma.topicProgress.upsert({
        where: {
          progressId_topicId: { progressId: progress.id, topicId: validTopicId },
        },
        update: {
          status: mappedStatus as any,
          timeSpent: { increment: timeSpent },
          lastAccessed: new Date(),
          completedAt: status === 'completed' ? new Date() : null,
        },
        create: {
          progressId: progress.id,
          topicId: validTopicId,
          status: mappedStatus as any,
          timeSpent,
          lastAccessed: new Date(),
          completedAt: status === 'completed' ? new Date() : null,
        },
      });

      res.json({ success: true, message: 'Topic progress updated successfully' });
    } catch (error) {
      console.error('Update topic progress error:', error);
      res.status(500).json({ success: false, error: 'Server error while updating topic progress' });
    }
  }
);

export default router;
