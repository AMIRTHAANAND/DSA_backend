import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import prisma from '../config/database';
import { protect, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/quizzes
// @desc    Get all published quizzes with filtering and pagination
// @access  Public
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('category').optional().isIn(['DATA_STRUCTURES', 'ALGORITHMS', 'CONCEPTS']).withMessage('Invalid category'),
    query('difficulty').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).withMessage('Invalid difficulty'),
    query('search').optional().isString().withMessage('Search must be a string')
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { page = 1, limit = 10, category, difficulty, search } = req.query;
      
      const where: any = { isPublished: true };
      if (category) where.category = category;
      if (difficulty) where.difficulty = difficulty;
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const quizzes = await prisma.quiz.findMany({
        where,
        include: {
          createdBy: {
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string)
      });

      const total = await prisma.quiz.count({ where });

      res.json({
        success: true,
        data: quizzes,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
          totalItems: total,
          itemsPerPage: parseInt(limit as string)
        }
      });
    } catch (error) {
      console.error('Get quizzes error:', error);
      res.status(500).json({ success: false, error: 'Server error while fetching quizzes' });
    }
  }
);

// @route   GET /api/quizzes/:id
// @desc    Get a single quiz by ID (without answers for public access)
// @access  Public
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: { 
        id: req.params.id, 
        isPublished: true 
      },
      include: {
        createdBy: {
          select: {
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    // Remove answers from questions for public access
    const publicQuiz = {
      ...quiz,
      questions: quiz.questions ? (quiz.questions as any[]).map((q: any) => {
        const { correctAnswer, ...questionWithoutAnswer } = q;
        return questionWithoutAnswer;
      }) : []
    };

    res.json({ success: true, data: publicQuiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ success: false, error: 'Server error while fetching quiz' });
  }
});

// @route   POST /api/quizzes
// @desc    Create a new quiz
// @access  Private (Admin/Instructor only)
router.post(
  '/',
  [
    protect,
    authorize('admin', 'instructor'),
    body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required and must be less than 200 characters'),
    body('description').isLength({ min: 1, max: 1000 }).withMessage('Description is required and must be less than 1000 characters'),
    body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
    body('questions.*.question').isLength({ min: 1 }).withMessage('Question text is required'),
    body('questions.*.options').isArray({ min: 2 }).withMessage('At least 2 options are required'),
    body('questions.*.correctAnswer').isInt({ min: 0 }).withMessage('Correct answer index is required'),
    body('difficulty').isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).withMessage('Invalid difficulty'),
    body('category').isIn(['DATA_STRUCTURES', 'ALGORITHMS', 'CONCEPTS']).withMessage('Invalid category'),
    body('timeLimit').optional().isInt({ min: 1 }).withMessage('Time limit must be a positive integer'),
    body('passingScore').optional().isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100')
  ],
  async (req: AuthRequest, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const quizData = {
        ...req.body,
        createdBy: req.user!.id,
        isPublished: false // Default to unpublished
      };

      const quiz = await prisma.quiz.create({
        data: quizData,
        include: {
          createdBy: {
            select: {
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      res.status(201).json({ success: true, message: 'Quiz created successfully', data: quiz });
    } catch (error) {
      console.error('Create quiz error:', error);
      res.status(500).json({ success: false, error: 'Server error while creating quiz' });
    }
  }
);

export default router;