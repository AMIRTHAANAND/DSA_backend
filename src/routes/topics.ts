import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import prisma from '../config/database';
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
      const topics = await prisma.topic.find(filter)
        .populate('createdBy', 'username firstName lastName')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit as string))
        .select('-content.explanation -content.pseudocode -content.codeSnippets')
        .lean();

      const total = await prisma.topic.countDocuments(filter);

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
    const topic = await prisma.topic.findOne({ slug: req.params.slug, isPublished: true })
      .populate('createdBy', 'username firstName lastName');

    if (!topic) return res.status(404).json({ success: false, error: 'prisma.topic not found' });

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
      const existingTopic = await prisma.topic.findFirst({ where: { slug: req.body.slug } });
      if (existingTopic) return res.status(400).json({ success: false, error: 'Topic with this slug already exists' });

      const topic = await prisma.topic.create({
        ...req.body,
        createdBy: req.user!.id,
        updatedBy: req.user!.id
      });

      res.status(201).json({ success: true, message: 'prisma.topic created successfully', data: topic });
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
      const topic = await prisma.topic.findById(req.params.id);
      if (!topic) return res.status(404).json({ success: false, error: 'prisma.topic not found' });

      if (req.body.slug && req.body.slug !== topic.slug) {
        const existingTopic = await prisma.topic.findFirst({ where: { slug: req.body.slug } });
        if (existingTopic) return res.status(400).json({ success: false, error: 'Topic with this slug already exists' });
      }

      const updatedTopic = await prisma.topic.update({
        where: { id: req.params.id },
        data: { ...req.body, updatedBy: req.user!.id }
      });

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
    const topic = await prisma.topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ success: false, error: 'prisma.topic not found' });

    await prisma.topic.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'prisma.topic deleted successfully' });
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
    const topic = await prisma.topic.findById(req.params.id);
    if (!topic) return res.status(404).json({ success: false, error: 'prisma.topic not found' });

    topic.isPublished = !topic.isPublished;
    topic.updatedBy = req.user!.id;
    await topic.save();

    res.json({
      success: true,
      message: `prisma.topic ${topic.isPublished ? 'published' : 'unpublished'} successfully`,
      data: { isPublished: topic.isPublished }
    });
  } catch (error) {
    console.error('Toggle topic publication error:', error);
    res.status(500).json({ success: false, error: 'Server error while toggling topic publication' });
  }
});

export default router;
