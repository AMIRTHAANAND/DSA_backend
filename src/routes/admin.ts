import express from 'express';
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
    ]);

    res.json({
      success: true,
      data: {
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
    });
  }
});

export default router;