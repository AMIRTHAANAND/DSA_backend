import express from 'express';
import { body } from 'express-validator';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
} from '../controllers/usersController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body('role')
    .optional()
    .isIn(['STUDENT', 'INSTRUCTOR', 'ADMIN'])
    .withMessage('Invalid role'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Routes
router.get('/', getUsers);
router.get('/stats', getUserStats);
router.get('/:id', getUser);
router.put('/:id', updateUserValidation, updateUser);
router.delete('/:id', deleteUser);

export default router;