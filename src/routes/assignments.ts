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

      const filter: any = { isPublished: true };

      if (difficulty) filter.difficulty = difficulty;
      if (category) filter.category = category;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search as string, 'i')] } }
        ];
      }
      if (tags) {
        const tagArray = (tags as string).split(',').map(tag => tag.trim());
        filter.tags = { $in: tagArray };
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const assignments = await prisma.assignment.find(filter)
        .populate('createdBy', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .select('-testCases -solution');

      const total = await prisma.assignment.countDocuments(filter);

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
    const assignment = await prisma.assignment.findOne({ _id: req.params.id, isPublished: true })
      .populate('createdBy', 'username firstName lastName');

    if (!assignment) return res.status(404).json({ success: false, error: 'prisma.assignment not found' });

    const publicAssignment = assignment;
    publicAssignment.testCases = publicAssignment.testCases.filter((tc: any) => !tc.isHidden);
    publicAssignment.solution = undefined;

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
        ...req.body,
        createdBy: req.user!.id,
        updatedBy: req.user!.id
      });

      res.status(201).json({ success: true, message: 'prisma.assignment created successfully', data: assignment });
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(500).json({ success: false, error: 'Server error while creating assignment' });
    }
  }
);

export default router;
