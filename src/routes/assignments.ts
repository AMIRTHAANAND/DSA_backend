import express from 'express';
import { body } from 'express-validator';
import {
  getAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
} from '../controllers/assignmentsController';
import { authenticate, requireAdmin, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Validation rules
const assignmentValidation = [
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and cannot exceed 100 characters'),
  body('description')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Description is required and cannot exceed 1000 characters'),
  body('problemStatement')
    .notEmpty()
    .withMessage('Problem statement is required'),
  body('difficulty')
    .isIn(['EASY', 'MEDIUM', 'HARD'])
    .withMessage('Invalid difficulty'),
  body('category')
    .isIn(['ARRAYS', 'STRINGS', 'LINKED_LISTS', 'TREES', 'GRAPHS', 'DYNAMIC_PROGRAMMING', 'GREEDY', 'OTHER'])
    .withMessage('Invalid category'),
  body('points')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Points must be at least 1'),
];

const submissionValidation = [
  body('code')
    .notEmpty()
    .withMessage('Code is required'),
  body('language')
    .isIn(['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp'])
    .withMessage('Invalid programming language'),
];

// Routes
router.get('/', optionalAuth, getAssignments);
router.get('/:id', optionalAuth, getAssignment);
router.post('/', authenticate, requireAdmin, assignmentValidation, createAssignment);
router.put('/:id', authenticate, requireAdmin, assignmentValidation, updateAssignment);
router.delete('/:id', authenticate, requireAdmin, deleteAssignment);
router.post('/:id/submit', authenticate, submissionValidation, submitAssignment);

export default router;