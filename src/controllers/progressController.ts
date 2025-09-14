import { Request, Response } from 'express';
import prisma from '../config/database';

// Get user progress
export const getUserProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    // Get or create progress record
    let progress = await prisma.progress.findFirst({
      where: { userId },
      include: {
        topicProgress: {
          include: {
            topic: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                estimatedTime: true,
              }
            }
          }
        },
        assignmentProgress: {
          include: {
            assignment: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                points: true,
              }
            }
          }
        },
        quizProgress: {
          include: {
            quiz: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                passingScore: true,
              }
            }
          }
        }
      }
    });

    if (!progress) {
      progress = await prisma.progress.create({
        data: { userId },
        include: {
          topicProgress: true,
          assignmentProgress: true,
          quizProgress: true,
        }
      });
    }

    // Calculate completion percentages
    const completionPercentage = progress.totalTopics + progress.totalAssignments + progress.totalQuizzes > 0
      ? Math.round(((progress.completedTopics + progress.completedAssignments + progress.completedQuizzes) / 
          (progress.totalTopics + progress.totalAssignments + progress.totalQuizzes)) * 100)
      : 0;

    const averageScore = progress.completedTopics + progress.completedAssignments + progress.completedQuizzes > 0
      ? Math.round(progress.overallScore / (progress.completedTopics + progress.completedAssignments + progress.completedQuizzes))
      : 0;

    res.json({
      success: true,
      data: {
        progress: {
          ...progress,
          completionPercentage,
          averageScore,
        }
      },
    });
  } catch (error) {
    console.error('Get user progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update topic progress
export const updateTopicProgress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { topicId } = req.params;
    const { status, timeSpent } = req.body;

    if (!['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
      return;
    }

    // Verify topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId }
    });

    if (!topic) {
      res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
      return;
    }

    // Get or create progress record
    let progress = await prisma.progress.findFirst({
      where: { userId }
    });

    if (!progress) {
      progress = await prisma.progress.create({
        data: { userId }
      });
    }

    // Get or create topic progress
    let topicProgress = await prisma.topicProgress.findFirst({
      where: {
        progressId: progress.id,
        topicId
      }
    });

    const updateData: any = {
      status,
      lastAccessed: new Date(),
    };

    if (timeSpent !== undefined) {
      updateData.timeSpent = timeSpent;
    }

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (topicProgress) {
      topicProgress = await prisma.topicProgress.update({
        where: { id: topicProgress.id },
        data: updateData,
      });
    } else {
      topicProgress = await prisma.topicProgress.create({
        data: {
          progressId: progress.id,
          topicId,
          ...updateData,
          quizScores: [],
          assignmentScores: [],
        }
      });
    }

    // Update overall progress stats
    const allTopicProgress = await prisma.topicProgress.findMany({
      where: { progressId: progress.id }
    });

    const completedTopics = allTopicProgress.filter(tp => tp.status === 'COMPLETED').length;

    await prisma.progress.update({
      where: { id: progress.id },
      data: {
        completedTopics,
        totalTopics: allTopicProgress.length,
        lastActivityDate: new Date(),
      }
    });

    res.json({
      success: true,
      message: 'Topic progress updated successfully',
      data: { topicProgress },
    });
  } catch (error) {
    console.error('Update topic progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get progress statistics
export const getProgressStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const progress = await prisma.progress.findFirst({
      where: { userId },
      include: {
        topicProgress: true,
        assignmentProgress: true,
        quizProgress: true,
      }
    });

    if (!progress) {
      res.json({
        success: true,
        data: {
          stats: {
            totalTopics: 0,
            completedTopics: 0,
            totalAssignments: 0,
            completedAssignments: 0,
            totalQuizzes: 0,
            completedQuizzes: 0,
            overallScore: 0,
            streakDays: 0,
            timeSpent: 0,
            completionPercentage: 0,
            averageScore: 0,
          }
        },
      });
      return;
    }

    // Calculate total time spent
    const totalTimeSpent = progress.topicProgress.reduce((sum, tp) => sum + tp.timeSpent, 0) +
                          progress.assignmentProgress.reduce((sum, ap) => sum + ap.timeSpent, 0) +
                          progress.quizProgress.reduce((sum, qp) => sum + qp.timeSpent, 0);

    // Calculate completion percentage
    const totalItems = progress.totalTopics + progress.totalAssignments + progress.totalQuizzes;
    const completedItems = progress.completedTopics + progress.completedAssignments + progress.completedQuizzes;
    const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Calculate average score
    const averageScore = completedItems > 0 ? Math.round(progress.overallScore / completedItems) : 0;

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.topicProgress.findMany({
      where: {
        progressId: progress.id,
        lastAccessed: {
          gte: sevenDaysAgo
        }
      },
      include: {
        topic: {
          select: {
            title: true,
            slug: true,
          }
        }
      },
      orderBy: { lastAccessed: 'desc' },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalTopics: progress.totalTopics,
          completedTopics: progress.completedTopics,
          totalAssignments: progress.totalAssignments,
          completedAssignments: progress.completedAssignments,
          totalQuizzes: progress.totalQuizzes,
          completedQuizzes: progress.completedQuizzes,
          overallScore: progress.overallScore,
          streakDays: progress.streakDays,
          timeSpent: totalTimeSpent,
          completionPercentage,
          averageScore,
          recentActivity,
        }
      },
    });
  } catch (error) {
    console.error('Get progress stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get leaderboard
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;

    const topUsers = await prisma.progress.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: [
        { overallScore: 'desc' },
        { completedTopics: 'desc' },
        { completedAssignments: 'desc' },
        { completedQuizzes: 'desc' },
      ],
      take: Number(limit),
    });

    const leaderboard = topUsers.map((progress, index) => {
      const totalItems = progress.totalTopics + progress.totalAssignments + progress.totalQuizzes;
      const completedItems = progress.completedTopics + progress.completedAssignments + progress.completedQuizzes;
      const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        rank: index + 1,
        user: progress.user,
        overallScore: progress.overallScore,
        completionPercentage,
        completedTopics: progress.completedTopics,
        completedAssignments: progress.completedAssignments,
        completedQuizzes: progress.completedQuizzes,
        streakDays: progress.streakDays,
      };
    });

    res.json({
      success: true,
      data: { leaderboard },
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};