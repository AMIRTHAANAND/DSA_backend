import express from 'express';
<<<<<<< HEAD
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
=======
import { body, query, param, validationResult } from 'express-validator'; // <- named imports
import Topic from '../models/Topic';
import { protect, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/topics
// @desc    Get all published topics with filtering and pagination
// @access  Public
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('category').optional().isIn(['data-structures', 'algorithms', 'concepts']).withMessage('Invalid category'),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
    query('search').optional().isString().withMessage('Search must be a string'),
    query('tags').optional().isString().withMessage('Tags must be a string')
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { page = 1, limit = 10, category, difficulty, search, tags } = req.query;

      const filter: any = { isPublished: true };
      if (category) filter.category = category;
      if (difficulty) filter.difficulty = difficulty;
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
      const topics = await Topic.find(filter)
        .populate('createdBy', 'username firstName lastName')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .select('-content.explanation -content.pseudocode -content.codeSnippets')
        .lean();

      const total = await Topic.countDocuments(filter);

      res.json({
        success: true,
        data: topics,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
          totalItems: total,
          itemsPerPage: parseInt(limit as string)
        }
      });
    } catch (error) {
      console.error('Get topics error:', error);
      res.status(500).json({ success: false, error: 'Server error while fetching topics' });
    }
  }
);

// @route   GET /api/topics/:slug
// @desc    Get a single topic by slug
// @access  Public
router.get('/:slug', async (req: express.Request, res: express.Response) => {
  try {
    const topic = await Topic.findOne({ slug: req.params.slug, isPublished: true })
      .populate('createdBy', 'username firstName lastName');

    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });

    res.json({ success: true, data: topic });
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({ success: false, error: 'Server error while fetching topic' });
  }
});

// @route   POST /api/topics
// @desc    Create a new topic
// @access  Private (Admin/Instructor only)
router.post(
  '/',
  [
    protect,
    authorize('admin', 'instructor'),
    body('title').notEmpty().withMessage('Title is required'),
    body('slug').notEmpty().withMessage('Slug is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').isIn(['data-structures', 'algorithms', 'concepts']).withMessage('Invalid category'),
    body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
    body('content.overview').notEmpty().withMessage('Overview is required'),
    body('content.explanation').notEmpty().withMessage('Explanation is required'),
    body('content.pseudocode').notEmpty().withMessage('Pseudocode is required'),
    body('content.complexity.time').notEmpty().withMessage('Time complexity is required'),
    body('content.complexity.space').notEmpty().withMessage('Space complexity is required'),
    body('estimatedTime').isInt({ min: 1 }).withMessage('Estimated time must be a positive integer')
  ],
  async (req: AuthRequest, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const existingTopic = await Topic.findOne({ slug: req.body.slug });
      if (existingTopic) return res.status(400).json({ success: false, error: 'Topic with this slug already exists' });

      const topic = await Topic.create({
        ...req.body,
        createdBy: req.user!.id,
        updatedBy: req.user!.id
      });

      res.status(201).json({ success: true, message: 'Topic created successfully', data: topic });
    } catch (error) {
      console.error('Create topic error:', error);
      res.status(500).json({ success: false, error: 'Server error while creating topic' });
    }
  }
);

// @route   PUT /api/topics/:id
// @desc    Update a topic
// @access  Private (Admin/Instructor only)
router.put(
  '/:id',
  [
    protect,
    authorize('admin', 'instructor'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('slug').optional().notEmpty().withMessage('Slug cannot be empty'),
    body('category').optional().isIn(['data-structures', 'algorithms', 'concepts']).withMessage('Invalid category'),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty')
  ],
  async (req: AuthRequest, res: express.Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const topic = await Topic.findById(req.params.id);
      if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });

      if (req.body.slug && req.body.slug !== topic.slug) {
        const existingTopic = await Topic.findOne({ slug: req.body.slug });
        if (existingTopic) return res.status(400).json({ success: false, error: 'Topic with this slug already exists' });
      }

      const updatedTopic = await Topic.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedBy: req.user!.id },
        { new: true, runValidators: true }
      );

      res.json({ success: true, message: 'Topic updated successfully', data: updatedTopic });
    } catch (error) {
      console.error('Update topic error:', error);
      res.status(500).json({ success: false, error: 'Server error while updating topic' });
    }
  }
);

// @route   DELETE /api/topics/:id
// @desc    Delete a topic
// @access  Private (Admin only)
router.delete('/:id', [protect, authorize('admin')], async (req: AuthRequest, res: express.Response) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });

    await Topic.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({ success: false, error: 'Server error while deleting topic' });
  }
});

// @route   PATCH /api/topics/:id/publish
// @desc    Toggle topic publication status
// @access  Private (Admin/Instructor only)
router.patch('/:id/publish', [protect, authorize('admin', 'instructor')], async (req: AuthRequest, res: express.Response) => {
  try {
    const topic = await Topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ success: false, error: 'Topic not found' });

    topic.isPublished = !topic.isPublished;
    topic.updatedBy = req.user!.id;
    await topic.save();

    res.json({
      success: true,
      message: `Topic ${topic.isPublished ? 'published' : 'unpublished'} successfully`,
      data: { isPublished: topic.isPublished }
    });
  } catch (error) {
    console.error('Toggle topic publication error:', error);
    res.status(500).json({ success: false, error: 'Server error while toggling topic publication' });
  }
});

export default router;
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
