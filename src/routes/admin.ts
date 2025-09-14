import express from 'express';
import { body, query, validationResult } from "express-validator";
import prisma from '../config/database';
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
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          users: userCount,
          activeUsers: activeUserCount,
          topics: topicCount,
          publishedTopics: publishedTopicCount,
          assignments: assignmentCount,
          publishedAssignments: publishedAssignmentCount,
          quizzes: quizCount,
          publishedQuizzes: publishedQuizCount,
        },
        recentActivity: {
          users: recentUsers,
          topics: recentTopics,
          assignments: recentAssignments,
        },
        distributions: {
          roles: roleDistribution,
          topicCategories: topicCategoryDistribution,
          assignmentDifficulties: assignmentDifficultyDistribution,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

export default router;