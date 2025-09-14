import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/database';

// Get all assignments
export const getAssignments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      difficulty, 
      category, 
      published, 
      page = 1, 
      limit = 10,
      search 
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    
    const where: any = {};
    
    if (difficulty) where.difficulty = difficulty;
    if (category) where.category = category;
    if (published !== undefined) where.isPublished = published === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          category: true,
          points: true,
          timeLimit: true,
          memoryLimit: true,
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
      prisma.assignment.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get single assignment
export const getAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
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

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
      return;
    }

    // If not published, only allow access to admins/instructors
    if (!assignment.isPublished && req.user?.role === 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Assignment not available',
      });
      return;
    }

    // For students, hide solution and some test cases
    if (req.user?.role === 'STUDENT') {
      const assignmentData = { ...assignment };
      assignmentData.solution = []; // Hide solutions from students
      
      // Show only visible test cases
      const testCases = assignmentData.testCases as any[];
      assignmentData.testCases = testCases.filter(tc => !tc.isHidden);
    }

    res.json({
      success: true,
      data: { assignment },
    });
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create assignment (admin/instructor only)
export const createAssignment = async (req: Request, res: Response): Promise<void> => {
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
      problemStatement,
      difficulty,
      category,
      constraints,
      examples,
      testCases,
      starterCode,
      solution,
      hints,
      timeLimit,
      memoryLimit,
      points,
      isPublished,
      tags
    } = req.body;

    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        problemStatement,
        difficulty,
        category,
        constraints: constraints || [],
        examples: examples || [],
        testCases: testCases || [],
        starterCode: starterCode || [],
        solution: solution || [],
        hints: hints || [],
        timeLimit: timeLimit || 1000,
        memoryLimit: memoryLimit || 128,
        points: points || 10,
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
      message: 'Assignment created successfully',
      data: { assignment },
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update assignment (admin/instructor only)
export const updateAssignment = async (req: Request, res: Response): Promise<void> => {
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

    const existingAssignment = await prisma.assignment.findUnique({
      where: { id }
    });

    if (!existingAssignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
      return;
    }

    const updateData = { ...req.body };
    updateData.updatedById = userId;

    const assignment = await prisma.assignment.update({
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
      message: 'Assignment updated successfully',
      data: { assignment },
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete assignment (admin/instructor only)
export const deleteAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const assignment = await prisma.assignment.findUnique({
      where: { id }
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
      return;
    }

    await prisma.assignment.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Assignment deleted successfully',
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Submit assignment solution
export const submitAssignment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { code, language } = req.body;

    if (!code || !language) {
      res.status(400).json({
        success: false,
        message: 'Code and language are required',
      });
      return;
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id }
    });

    if (!assignment) {
      res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
      return;
    }

    if (!assignment.isPublished) {
      res.status(403).json({
        success: false,
        message: 'Assignment not available for submission',
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

    // Get or create assignment progress
    let assignmentProgress = await prisma.assignmentProgress.findFirst({
      where: {
        progressId: progress.id,
        assignmentId: id
      }
    });

    const submissionData = {
      code,
      language,
      submittedAt: new Date()
    };

    // Mock test results (in real app, you'd run the code against test cases)
    const testResults = {
      passed: 5,
      total: 10,
      details: []
    };

    const score = Math.round((testResults.passed / testResults.total) * (assignment.points as number));

    if (assignmentProgress) {
      assignmentProgress = await prisma.assignmentProgress.update({
        where: { id: assignmentProgress.id },
        data: {
          status: 'SUBMITTED',
          submission: submissionData,
          testResults,
          score,
          attempts: assignmentProgress.attempts + 1,
          lastAttemptAt: new Date(),
          completedAt: testResults.passed === testResults.total ? new Date() : null,
        }
      });
    } else {
      assignmentProgress = await prisma.assignmentProgress.create({
        data: {
          progressId: progress.id,
          assignmentId: id,
          status: 'SUBMITTED',
          submission: submissionData,
          testResults,
          score,
          maxScore: assignment.points as number,
          attempts: 1,
          lastAttemptAt: new Date(),
          completedAt: testResults.passed === testResults.total ? new Date() : null,
        }
      });
    }

    res.json({
      success: true,
      message: 'Assignment submitted successfully',
      data: {
        submission: assignmentProgress,
        testResults,
        score,
        maxScore: assignment.points
      },
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};