import express from 'express';
import { body } from 'express-validator';
import {
  registerAdmin,
  loginAdmin,
  getPendingAdmins,
  approveAdmin,
  rejectAdmin,
} from '../controllers/adminAuthController';
import { authenticateAdmin, requireSuperAdmin } from '../middleware/adminAuth';

const router = express.Router();

// Validation rules
const adminRegisterValidation = [
  body('name')
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and cannot exceed 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const adminLoginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Public routes
router.post('/register', adminRegisterValidation, registerAdmin);
router.post('/login', adminLoginValidation, loginAdmin);

// Protected routes (require super admin)
router.get('/pending', authenticateAdmin, requireSuperAdmin, getPendingAdmins);
router.put('/approve/:adminId', authenticateAdmin, requireSuperAdmin, approveAdmin);
router.delete('/reject/:adminId', authenticateAdmin, requireSuperAdmin, rejectAdmin);

export default router;
