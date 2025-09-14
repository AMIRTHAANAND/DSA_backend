import express from 'express';
<<<<<<< HEAD
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
=======
import { body, query, param, validationResult } from 'express-validator'; // <- named imports
import Quiz from '../models/Quiz';
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
    query('category').optional().isIn(['data-structures', 'algorithms', 'concepts', 'mixed']).withMessage('Invalid category'),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
    query('search').optional().isString().withMessage('Search must be a string')
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { page = 1, limit = 10, category, difficulty, search } = req.query;
      const filter: any = { isPublished: true };
      if (category) filter.category = category;
      if (difficulty) filter.difficulty = difficulty;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const quizzes = await Quiz.find(filter)
        .populate('createdBy', 'username firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .select('-questions')
        .lean();

      const total = await Quiz.countDocuments(filter);

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
    const quiz = await Quiz.findOne({ _id: req.params.id, isPublished: true })
      .populate('createdBy', 'username firstName lastName');

    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    const publicQuiz = quiz.toObject();
    publicQuiz.questions = publicQuiz.questions.map((q: any) => {
      const { correctAnswer, ...questionWithoutAnswer } = q;
      return questionWithoutAnswer;
    });

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
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').isIn(['data-structures', 'algorithms', 'concepts', 'mixed']).withMessage('Invalid category'),
    body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
    body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
    body('questions.*.question').notEmpty().withMessage('Question text is required'),
    body('questions.*.type').isIn(['multiple-choice', 'true-false', 'fill-in-blank', 'code-completion']).withMessage('Invalid question type'),
    body('questions.*.correctAnswer').notEmpty().withMessage('Correct answer is required'),
    body('questions.*.explanation').notEmpty().withMessage('Explanation is required'),
    body('passingScore').isInt({ min: 0, max: 100 }).withMessage('Passing score must be between 0 and 100')
  ],
  async (req: AuthRequest, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const quiz = await Quiz.create({ ...req.body, createdBy: req.user!.id, updatedBy: req.user!.id });
      res.status(201).json({ success: true, message: 'Quiz created successfully', data: quiz });
    } catch (error) {
      console.error('Create quiz error:', error);
      res.status(500).json({ success: false, error: 'Server error while creating quiz' });
    }
  }
);

// @route   PUT /api/quizzes/:id
// @desc    Update a quiz
// @access  Private (Admin/Instructor only)
router.put(
  '/:id',
  [
    protect,
    authorize('admin', 'instructor'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('category').optional().isIn(['data-structures', 'algorithms', 'concepts', 'mixed']).withMessage('Invalid category'),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty')
  ],
  async (req: AuthRequest, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

      const updatedQuiz = await Quiz.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedBy: req.user!.id },
        { new: true, runValidators: true }
      );

      res.json({ success: true, message: 'Quiz updated successfully', data: updatedQuiz });
    } catch (error) {
      console.error('Update quiz error:', error);
      res.status(500).json({ success: false, error: 'Server error while updating quiz' });
    }
  }
);

// @route   DELETE /api/quizzes/:id
// @desc    Delete a quiz
// @access  Private (Admin only)
router.delete('/:id', [protect, authorize('admin')], async (req: AuthRequest, res: express.Response) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    await Quiz.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ success: false, error: 'Server error while deleting quiz' });
  }
});

// @route   PATCH /api/quizzes/:id/publish
// @desc    Toggle quiz publication status
// @access  Private (Admin/Instructor only)
router.patch('/:id/publish', [protect, authorize('admin', 'instructor')], async (req: AuthRequest, res: express.Response) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, error: 'Quiz not found' });

    quiz.isPublished = !quiz.isPublished;
    quiz.updatedBy = req.user!.id;
    await quiz.save();

    res.json({ success: true, message: `Quiz ${quiz.isPublished ? 'published' : 'unpublished'} successfully`, data: { isPublished: quiz.isPublished } });
  } catch (error) {
    console.error('Toggle quiz publication error:', error);
    res.status(500).json({ success: false, error: 'Server error while toggling quiz publication' });
  }
});

// @route   POST /api/quizzes/:id/submit
// @desc    Submit quiz answers and get results
// @access  Private
router.post(
  '/:id/submit',
  [
    protect,
    body('answers').isArray({ min: 1 }).withMessage('Answers are required'),
    body('answers.*.questionIndex').isInt({ min: 0 }).withMessage('Question index is required'),
    body('answers.*.userAnswer').notEmpty().withMessage('User answer is required')
  ],
  async (req: AuthRequest, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const quiz = await Quiz.findById(req.params.id);
      if (!quiz || !quiz.isPublished) return res.status(404).json({ success: false, error: 'Quiz not found' });

      const { answers } = req.body;
      let score = 0;
      const scoredAnswers = answers.map((answer: any) => {
        const question = quiz.questions[answer.questionIndex];
        if (!question) return { questionIndex: answer.questionIndex, userAnswer: answer.userAnswer, isCorrect: false, pointsEarned: 0 };

        let isCorrect = false;
        if (question.type === 'multiple-choice' || question.type === 'true-false') {
          isCorrect = question.correctAnswer === answer.userAnswer;
        } else if (question.type === 'fill-in-blank' || question.type === 'code-completion') {
          isCorrect = (question.correctAnswer as string).toLowerCase().trim() === answer.userAnswer.toLowerCase().trim();
        }

        const pointsEarned = isCorrect ? question.points : 0;
        score += pointsEarned;

        return { questionIndex: answer.questionIndex, userAnswer: answer.userAnswer, isCorrect, pointsEarned };
      });

      const maxScore = quiz.questions.reduce((total, q) => total + q.points, 0);
      const percentage = Math.round((score / maxScore) * 100);
      const passed = percentage >= quiz.passingScore;

      res.json({
        success: true,
        message: 'Quiz submitted successfully',
        data: { quizId: quiz._id, score, maxScore, percentage, passed, answers: scoredAnswers, submittedAt: new Date() }
      });
    } catch (error) {
      console.error('Submit quiz error:', error);
      res.status(500).json({ success: false, error: 'Server error while submitting quiz' });
    }
  }
);

export default router;
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
