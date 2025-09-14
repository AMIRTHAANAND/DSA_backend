import express from 'express';
import { body } from 'express-validator';
import {
  getUserProgress,
  updateTopicProgress,
  getProgressStats,
  getLeaderboard,
} from '../controllers/progressController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Validation rules
const topicProgressValidation = [
  body('status')
    .isIn(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
    .withMessage('Invalid status'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a positive number'),
];

// Routes
router.get('/', authenticate, getUserProgress);
router.get('/stats', authenticate, getProgressStats);
router.get('/leaderboard', optionalAuth, getLeaderboard);
router.put('/topics/:topicId', authenticate, topicProgressValidation, updateTopicProgress);

export default router;