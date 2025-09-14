import express from 'express';
<<<<<<< HEAD
import {
  getUserStats,
} from '../controllers/usersController';
import { authenticateAdmin } from '../middleware/adminAuth';
import prisma from '../config/database';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalTopics,
      totalAssignments,
      totalQuizzes,
      recentActivity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.topic.count(),
      prisma.assignment.count(),
      prisma.quiz.count(),
      prisma.loginEvent.findMany({
        include: {
          user: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalTopics,
          totalAssignments,
          totalQuizzes,
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Content stats
router.get('/content-stats', async (req, res) => {
  try {
    const [
      publishedTopics,
      draftTopics,
      publishedAssignments,
      draftAssignments,
      publishedQuizzes,
      draftQuizzes,
    ] = await Promise.all([
      prisma.topic.count({ where: { isPublished: true } }),
      prisma.topic.count({ where: { isPublished: false } }),
      prisma.assignment.count({ where: { isPublished: true } }),
      prisma.assignment.count({ where: { isPublished: false } }),
      prisma.quiz.count({ where: { isPublished: true } }),
      prisma.quiz.count({ where: { isPublished: false } }),
    ]);

    res.json({
      success: true,
      data: {
        topics: {
          published: publishedTopics,
          draft: draftTopics,
          total: publishedTopics + draftTopics,
        },
        assignments: {
          published: publishedAssignments,
          draft: draftAssignments,
          total: publishedAssignments + draftAssignments,
        },
        quizzes: {
          published: publishedQuizzes,
          draft: draftQuizzes,
          total: publishedQuizzes + draftQuizzes,
        },
      },
    });
  } catch (error) {
    console.error('Content stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// User engagement stats
router.get('/engagement-stats', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      activeUsers,
      totalProgress,
      completedAssignments,
      completedQuizzes,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          lastLogin: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.progress.count(),
      prisma.assignmentProgress.count({
        where: { status: 'COMPLETED' }
      }),
      prisma.quizProgress.count({
        where: { status: 'COMPLETED' }
      }),
=======
import { body, query, validationResult } from "express-validator";



import User from '../models/User';
import Topic from '../models/Topic';
import Assignment from '../models/Assignment';
import Quiz from '../models/Quiz';
import Progress from '../models/Progress';
import { protect, authorize } from '../middleware/auth';


const router = express.Router();

// All admin routes require admin role
router.use(protect, authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req: express.Request, res: express.Response) => {
  try {
    // Get counts
    const userCount = await User.countDocuments();
    const activeUserCount = await User.countDocuments({ isActive: true });
    const topicCount = await Topic.countDocuments();
    const publishedTopicCount = await Topic.countDocuments({ isPublished: true });
    const assignmentCount = await Assignment.countDocuments();
    const publishedAssignmentCount = await Assignment.countDocuments({ isPublished: true });
    const quizCount = await Quiz.countDocuments();
    const publishedQuizCount = await Quiz.countDocuments({ isPublished: true });

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email firstName lastName role createdAt');

    const recentTopics = await Topic.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title slug category difficulty isPublished createdAt')
      .populate('createdBy', 'username firstName lastName');

    const recentAssignments = await Assignment.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title difficulty category isPublished createdAt')
      .populate('createdBy', 'username firstName lastName');

    // Get user role distribution
    const roleDistribution = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get topic category distribution
    const topicCategoryDistribution = await Topic.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get assignment difficulty distribution
    const assignmentDifficultyDistribution = await Assignment.aggregate([
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
    ]);

    res.json({
      success: true,
      data: {
<<<<<<< HEAD
        activeUsers,
        totalProgress,
        completedAssignments,
        completedQuizzes,
      },
    });
  } catch (error) {
    console.error('Engagement stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
=======
        counts: {
          users: userCount,
          activeUsers: activeUserCount,
          topics: topicCount,
          publishedTopics: publishedTopicCount,
          assignments: assignmentCount,
          publishedAssignments: publishedAssignmentCount,
          quizzes: quizCount,
          publishedQuizzes: publishedQuizCount
        },
        recentActivity: {
          users: recentUsers,
          topics: recentTopics,
          assignments: recentAssignments
        },
        distributions: {
          userRoles: roleDistribution,
          topicCategories: topicCategoryDistribution,
          assignmentDifficulties: assignmentDifficultyDistribution
        }
      }
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching admin dashboard'
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
    });
  }
});

<<<<<<< HEAD
export default router;
=======
// @route   GET /api/admin/users
// @desc    Get all users with pagination and filtering
// @access  Private (Admin only)
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['student', 'admin', 'instructor']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  query('search').optional().isString().withMessage('Search must be a string')
], async (req: express.Request, res: express.Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      role,
      status,
      search
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (role) filter.role = role;
    if (status === 'active') filter.isActive = true;
    if (status === 'inactive') filter.isActive = false;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Execute query
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: parseInt(page as string),
        totalPages: Math.ceil(total / parseInt(limit as string)),
        totalItems: total,
        itemsPerPage: parseInt(limit as string)
      }
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching users'
    });
  }
});

// @route   GET /api/admin/topics
// @desc    Get all topics with pagination and filtering
// @access  Private (Admin only)
router.get('/topics', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['data-structures', 'algorithms', 'concepts']).withMessage('Invalid category'),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
  query('status').optional().isIn(['published', 'unpublished']).withMessage('Invalid status'),
  query('search').optional().isString().withMessage('Search must be a string')
], async (req: express.Request, res: express.Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      category,
      difficulty,
      status,
      search
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (status === 'published') filter.isPublished = true;
    if (status === 'unpublished') filter.isPublished = false;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Execute query
    const topics = await Topic.find(filter)
      .populate('createdBy', 'username firstName lastName')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

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
    console.error('Get admin topics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching topics'
    });
  }
});

// @route   GET /api/admin/assignments
// @desc    Get all assignments with pagination and filtering
// @access  Private (Admin only)
router.get('/assignments', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  query('category').optional().isIn(['arrays', 'strings', 'linked-lists', 'trees', 'graphs', 'dynamic-programming', 'greedy', 'other']).withMessage('Invalid category'),
  query('status').optional().isIn(['published', 'unpublished']).withMessage('Invalid status'),
  query('search').optional().isString().withMessage('Search must be a string')
], async (req: express.Request, res: express.Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      difficulty,
      category,
      status,
      search
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (status === 'published') filter.isPublished = true;
    if (status === 'unpublished') filter.isPublished = false;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search as string, 'i')] } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Execute query
    const assignments = await Assignment.find(filter)
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await Assignment.countDocuments(filter);

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
    console.error('Get admin assignments error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching assignments'
    });
  }
});

// @route   GET /api/admin/quizzes
// @desc    Get all quizzes with pagination and filtering
// @access  Private (Admin only)
router.get('/quizzes', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isIn(['data-structures', 'algorithms', 'concepts', 'mixed']).withMessage('Invalid category'),
  query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
  query('status').optional().isIn(['published', 'unpublished']).withMessage('Invalid status'),
  query('search').optional().isString().withMessage('Search must be a string')
], async (req: express.Request, res: express.Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      page = 1,
      limit = 20,
      category,
      difficulty,
      status,
      search
    } = req.query;

    // Build filter object
    const filter: any = {};

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (status === 'published') filter.isPublished = true;
    if (status === 'unpublished') filter.isPublished = false;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    // Execute query
    const quizzes = await Quiz.find(filter)
      .populate('createdBy', 'username firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

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
    console.error('Get admin quizzes error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching quizzes'
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get analytics data for admin dashboard
// @access  Private (Admin only)
router.get('/analytics', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Invalid period')
], async (req: express.Request, res: express.Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user registration trends
    const userRegistrationTrends = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get content creation trends
    const topicCreationTrends = await Topic.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const assignmentCreationTrends = await Assignment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Get user engagement metrics
    const totalProgressRecords = await Progress.countDocuments();
    const activeUsers = await Progress.countDocuments({
      lastActivityDate: { $gte: startDate }
    });

    // Get content performance metrics
    const topicViews = await Topic.aggregate([
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$contentLength' } // Using content length as proxy for views
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        period,
        userRegistrationTrends,
        topicCreationTrends,
        assignmentCreationTrends,
        engagement: {
          totalProgressRecords,
          activeUsers,
          totalViews: topicViews[0]?.totalViews || 0
        }
      }
    });
  } catch (error) {
    console.error('Get admin analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while fetching analytics'
    });
  }
});

export default router;
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
