import express, { Request, Response } from 'express';
import { body, query, validationResult } from "express-validator";
import prisma from '../config/database';
import { protect, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * @route   GET /api/assignments
 * @desc    Get all published assignments with filtering and pagination
 * @access  Public
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
    query('category').optional().isIn([
      'arrays', 'strings', 'linked-lists', 'trees', 'graphs', 'dynamic-programming', 'greedy', 'other'
    ]).withMessage('Invalid category'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('tags').optional().isString().withMessage('Tags must be a string')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { page = 1, limit = 10, difficulty, category, search, tags } = req.query;

      const where: any = { isPublished: true };

      if (difficulty) where.difficulty = difficulty;
      if (category) where.category = category;
      if (search) {
        where.OR = [
          { title: { contains: String(search), mode: 'insensitive' } },
          { description: { contains: String(search), mode: 'insensitive' } }
        ];
      }
      // tags is a JSON field; complex search omitted.

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const assignments = await prisma.assignment.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { username: true, firstName: true, lastName: true } } }
      });

      const total = await prisma.assignment.count({ where });

      res.json({
        success: true,
        data: assignments,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
          totalItems: total,
          itemsPerPage: parseInt(limit as string)
        }
      });
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).json({ success: false, error: 'Server error while fetching assignments' });
    }
  }
);

/**
 * @route   GET /api/assignments/:id
 * @desc    Get single assignment
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await prisma.assignment.findFirst({
      where: { id: req.params.id, isPublished: true },
      include: { createdBy: { select: { username: true, firstName: true, lastName: true } } }
    });

    if (!assignment) return res.status(404).json({ success: false, error: 'Assignment not found' });

    // Remove hidden test cases and solutions from response if present
    const publicAssignment: any = { ...assignment };
    if (Array.isArray(publicAssignment.testCases)) {
      publicAssignment.testCases = publicAssignment.testCases.filter((tc: any) => !tc?.isHidden);
    }
    if (publicAssignment.solution) {
      publicAssignment.solution = undefined;
    }

    res.json({ success: true, data: publicAssignment });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ success: false, error: 'Server error while fetching assignment' });
  }
});

/**
 * @route   POST /api/assignments
 * @desc    Create assignment
 * @access  Private (Admin/Instructor)
 */
router.post(
  '/',
  protect,
  authorize('admin', 'instructor'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('problemStatement').notEmpty().withMessage('Problem statement is required'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('category').isIn([
    'arrays', 'strings', 'linked-lists', 'trees', 'graphs', 'dynamic-programming', 'greedy', 'other'
  ]).withMessage('Invalid category'),
  body('testCases').isArray({ min: 1 }).withMessage('At least one test case is required'),
  body('starterCode').isArray({ min: 1 }).withMessage('At least one starter code is required'),
  body('solution').isArray({ min: 1 }).withMessage('At least one solution is required'),
  body('points').isInt({ min: 1 }).withMessage('Points must be positive'),
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const assignment = await prisma.assignment.create({
        data: {
          ...req.body,
          createdById: req.user!.id,
          updatedById: req.user!.id
        }
      });

      res.status(201).json({ success: true, message: 'Assignment created successfully', data: assignment });
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(500).json({ success: false, error: 'Server error while creating assignment' });
    }
  }
);

export default router;
