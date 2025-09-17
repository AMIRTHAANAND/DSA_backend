import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/database';

// Get all quizzes
export const getQuizzes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      category, 
      difficulty, 
      published, 
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (published !== undefined) where.isPublished = published === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          difficulty: true,
          questions: true,
          timeLimit: true,
          passingScore: true,
          maxAttempts: true,
          isPublished: true,
          tags: true,
          createdAt: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.quiz.count({ where })
    ]);

    // Add question count for each quiz
    const quizzesWithCounts = quizzes.map(quiz => ({
      ...quiz,
      questionsCount: Array.isArray(quiz.questions) ? (quiz.questions as any[]).length : 0,
      totalPoints: Array.isArray(quiz.questions) 
        ? (quiz.questions as any[]).reduce((sum, q) => sum + (q.points || 1), 0) 
        : 0
    }));

    res.json({
      success: true,
      data: {
        quizzes: quizzesWithCounts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get single quiz
export const getQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    if (!quiz) {
      res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
      return;
    }

    // If not published, only allow access to admins/instructors
    if (!quiz.isPublished && req.user?.role === 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Quiz not available',
      });
      return;
    }

    // For students taking the quiz, hide correct answers
    if (req.user?.role === 'STUDENT') {
      const quizData = { ...quiz };
      const questions = quizData.questions as any[];
      quizData.questions = questions.map(q => ({
        ...q,
        correctAnswer: undefined, // Hide correct answers
        explanation: undefined    // Hide explanations until after submission
      }));
    }

    res.json({
      success: true,
      data: { quiz },
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create quiz (admin/instructor only)
export const createQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const userId = req.user.id;
    const {
      title,
      description,
      category,
      difficulty,
      questions,
      timeLimit,
      passingScore,
      maxAttempts,
      isPublished,
      tags
    } = req.body;

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        category,
        difficulty,
        questions: questions || [],
        timeLimit: timeLimit || 0,
        passingScore: passingScore || 70,
        maxAttempts: maxAttempts || 0,
        isPublished: isPublished || false,
        tags: tags || [],
        createdById: userId,
        updatedById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: { quiz },
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update quiz (admin/instructor only)
export const updateQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { id } = req.params;
    const userId = req.user.id;

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id }
    });

    if (!existingQuiz) {
      res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
      return;
    }

    const updateData = { ...req.body };
    updateData.updatedById = userId;

    const quiz = await prisma.quiz.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        updatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: { quiz },
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete quiz (admin/instructor only)
export const deleteQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const quiz = await prisma.quiz.findUnique({
      where: { id }
    });

    if (!quiz) {
      res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
      return;
    }

    await prisma.quiz.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Submit quiz answers
export const submitQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({
        success: false,
        message: 'Answers array is required',
      });
      return;
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id }
    });

    if (!quiz) {
      res.status(404).json({
        success: false,
        message: 'Quiz not found',
      });
      return;
    }

    if (!quiz.isPublished) {
      res.status(403).json({
        success: false,
        message: 'Quiz not available for submission',
      });
      return;
    }

    // Get or create user progress
    let progress = await prisma.progress.findFirst({
      where: { userId }
    });

    if (!progress) {
      progress = await prisma.progress.create({
        data: { userId }
      });
    }

    // Check existing attempts
    const existingProgress = await prisma.quizProgress.findFirst({
      where: {
        progressId: progress.id,
        quizId: id
      }
    });

    if (existingProgress && quiz.maxAttempts > 0 && existingProgress.attempts >= quiz.maxAttempts) {
      res.status(400).json({
        success: false,
        message: 'Maximum attempts exceeded',
      });
      return;
    }

    // Grade the quiz
    const questions = quiz.questions as any[];
    let totalScore = 0;
    let maxScore = 0;
    
    const gradedAnswers = answers.map((answer: any, index: number) => {
      const question = questions[index];
      if (!question) return null;

      const isCorrect = JSON.stringify(answer.userAnswer) === JSON.stringify(question.correctAnswer);
      const pointsEarned = isCorrect ? (question.points || 1) : 0;
      
      totalScore += pointsEarned;
      maxScore += (question.points || 1);

      return {
        questionIndex: index,
        userAnswer: answer.userAnswer,
        isCorrect,
        pointsEarned
      };
    }).filter(Boolean);

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const isPassed = percentage >= quiz.passingScore;

    // Create or update quiz progress
    let quizProgress;
    if (existingProgress) {
      quizProgress = await prisma.quizProgress.update({
        where: { id: existingProgress.id },
        data: {
          status: 'COMPLETED',
          score: totalScore,
          percentage,
          answers: gradedAnswers,
          attempts: existingProgress.attempts + 1,
          completedAt: new Date(),
        }
      });
    } else {
      quizProgress = await prisma.quizProgress.create({
        data: {
          progressId: progress.id,
          quizId: id,
          status: 'COMPLETED',
          score: totalScore,
          maxScore,
          percentage,
          answers: gradedAnswers,
          attempts: 1,
          maxAttempts: quiz.maxAttempts,
          startedAt: new Date(),
          completedAt: new Date(),
        }
      });
    }

    // Return results with explanations
    const resultsWithExplanations = gradedAnswers.map((answer: any, index: number) => {
      const question = questions[index];
      return {
        ...answer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      };
    });

    res.json({
      success: true,
      message: `Quiz ${isPassed ? 'passed' : 'completed'}!`,
      data: {
        submission: quizProgress,
        results: resultsWithExplanations,
        score: totalScore,
        maxScore,
        percentage,
        passed: isPassed,
        passingScore: quiz.passingScore
      },
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};