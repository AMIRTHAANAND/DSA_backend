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
    const [
      userCount,
      activeUserCount,
      topicCount,
      publishedTopicCount,
      assignmentCount,
      publishedAssignmentCount,
      quizCount,
      publishedQuizCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.topic.count(),
      prisma.topic.count({ where: { isPublished: true } }),
      prisma.assignment.count(),
      prisma.assignment.count({ where: { isPublished: true } }),
      prisma.quiz.count(),
      prisma.quiz.count({ where: { isPublished: true } }),
    ]);

    // Get recent activity
    const [recentUsers, recentTopics, recentAssignments] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { username: true, email: true, firstName: true, lastName: true, role: true, createdAt: true }
      }),
      prisma.topic.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          title: true,
          slug: true,
          category: true,
          difficulty: true,
          isPublished: true,
          createdAt: true,
          createdBy: { select: { username: true, firstName: true, lastName: true } }
        }
      }),
      prisma.assignment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          title: true,
          category: true,
          difficulty: true,
          isPublished: true,
          createdAt: true,
          createdBy: { select: { username: true, firstName: true, lastName: true } }
        }
      })
    ]);

    // Get user role distribution
    const roleGroup = await prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true }
    });
    const roleDistribution = roleGroup
      .map(r => ({ _id: r.role, count: r._count._all }))
      .sort((a, b) => b.count - a.count);

    // Get topic category distribution
    const topicGroup = await prisma.topic.groupBy({
      by: ['category'],
      _count: { _all: true }
    });
    const topicCategoryDistribution = topicGroup
      .map(t => ({ _id: t.category, count: t._count._all }))
      .sort((a, b) => b.count - a.count);

    // Get assignment difficulty distribution
    const assignmentGroup = await prisma.assignment.groupBy({
      by: ['difficulty'],
      _count: { _all: true }
    });
    const assignmentDifficultyDistribution = assignmentGroup
      .map(a => ({ _id: a.difficulty, count: a._count._all }))
      .sort((a, b) => b.count - a.count);

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