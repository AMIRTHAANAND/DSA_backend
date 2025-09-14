import express from 'express';
import { body } from 'express-validator';
import {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
} from '../controllers/quizzesController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Validation rules
const quizValidation = [
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and cannot exceed 100 characters'),
  body('description')
    .isLength({ min: 1, max: 500 })
    .withMessage('Description is required and cannot exceed 500 characters'),
  body('category')
    .isIn(['DATA_STRUCTURES', 'ALGORITHMS', 'CONCEPTS', 'MIXED'])
    .withMessage('Invalid category'),
  body('difficulty')
    .isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
    .withMessage('Invalid difficulty'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  body('passingScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100'),
];

const submissionValidation = [
  body('answers')
    .isArray({ min: 1 })
    .withMessage('Answers array is required'),
];

// Routes
router.get('/', optionalAuth, getQuizzes);
router.get('/:id', optionalAuth, getQuiz);
router.post('/', authenticate, requireAdmin, quizValidation, createQuiz);
router.put('/:id', authenticate, requireAdmin, quizValidation, updateQuiz);
router.delete('/:id', authenticate, requireAdmin, deleteQuiz);
router.post('/:id/submit', authenticate, submissionValidation, submitQuiz);

export default router;