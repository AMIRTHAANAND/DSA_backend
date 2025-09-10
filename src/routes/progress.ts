import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';

import Progress from '../models/Progress';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/progress
 * @desc    Get current user's learning progress
 * @access  Private
 */
router.get('/', protect, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    let progress = await Progress.findOne({ userId: req.user.id });

    if (!progress) {
      progress = await Progress.create({ userId: req.user.id });
    }

    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ success: false, error: 'Server error while fetching progress' });
  }
});

/**
 * @route   POST /api/progress/topic
 * @desc    Update topic progress
 * @access  Private
 */
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

    try {
      let progress = await Progress.findOne({ userId: req.user.id });
      if (!progress) progress = await Progress.create({ userId: req.user.id });

      const topicIndex = progress.topicProgress.findIndex(tp => tp.topicId.toString() === topicId);

      if (topicIndex >= 0) {
        const tp = progress.topicProgress[topicIndex];
        tp.status = status;
        tp.timeSpent += timeSpent;
        tp.lastAccessed = new Date();
        if (status === 'completed' && !tp.completedAt) tp.completedAt = new Date();
      } else {
        progress.topicProgress.push({
          topicId,
          status,
          timeSpent,
          lastAccessed: new Date(),
          completedAt: status === 'completed' ? new Date() : undefined,
          quizScores: [],
          assignmentScores: [],
        });
      }

      progress.completedTopics = progress.topicProgress.filter(tp => tp.status === 'completed').length;
      progress.totalTopics = progress.topicProgress.length;
      progress.lastActivityDate = new Date();

      await progress.save();

      res.json({ success: true, message: 'Topic progress updated successfully', data: progress });
    } catch (error) {
      console.error('Update topic progress error:', error);
      res.status(500).json({ success: false, error: 'Server error while updating topic progress' });
    }
  }
);

export default router;
