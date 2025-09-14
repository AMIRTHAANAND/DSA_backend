import express from 'express';
import { body } from 'express-validator';
import {
  getTopics,
  getTopicBySlug,
  createTopic,
  updateTopic,
  deleteTopic,
} from '../controllers/topicsController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Validation rules
const topicValidation = [
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and cannot exceed 100 characters'),
  body('slug')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  body('description')
    .isLength({ min: 1, max: 500 })
    .withMessage('Description is required and cannot exceed 500 characters'),
  body('category')
    .isIn(['DATA_STRUCTURES', 'ALGORITHMS', 'CONCEPTS'])
    .withMessage('Invalid category'),
  body('difficulty')
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
    .withMessage('Invalid difficulty'),
  body('overview')
    .notEmpty()
    .withMessage('Overview is required'),
  body('explanation')
    .notEmpty()
    .withMessage('Explanation is required'),
  body('pseudocode')
    .notEmpty()
    .withMessage('Pseudocode is required'),
  body('whyItMatters')
    .notEmpty()
    .withMessage('Why it matters section is required'),
  body('estimatedTime')
    .isInt({ min: 1 })
    .withMessage('Estimated time must be at least 1 minute'),
];

// Routes
router.get('/', optionalAuth, getTopics);
router.get('/:slug', optionalAuth, getTopicBySlug);
router.post('/', authenticate, requireAdmin, topicValidation, createTopic);
router.put('/:id', authenticate, requireAdmin, topicValidation, updateTopic);
router.delete('/:id', authenticate, requireAdmin, deleteTopic);

export default router;