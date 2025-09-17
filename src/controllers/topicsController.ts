import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import prisma from '../config/database';

// Get all topics
export const getTopics = async (req: Request, res: Response): Promise<void> => {
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

    const [topics, total] = await Promise.all([
      prisma.topic.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          category: true,
          difficulty: true,
          estimatedTime: true,
          isPublished: true,
          order_index: true,
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
        orderBy: [
          { order_index: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: Number(limit),
      }),
      prisma.topic.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        topics,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      },
    });
  } catch (error) {
    console.error('Get topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get single topic by slug
export const getTopicBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const topic = await prisma.topic.findUnique({
      where: { slug },
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
        },
        relatedTopics: {
          include: {
            relatedTopic: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
              }
            }
          }
        }
      }
    });

    if (!topic) {
      res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
      return;
    }

    // If not published, only allow access to admins/instructors
    if (!topic.isPublished && req.user?.role === 'STUDENT') {
      res.status(403).json({
        success: false,
        message: 'Topic not available',
      });
      return;
    }

    res.json({
      success: true,
      data: { topic },
    });
  } catch (error) {
    console.error('Get topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create topic (admin/instructor only)
export const createTopic = async (req: Request, res: Response): Promise<void> => {
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
      slug,
      description,
      category,
      difficulty,
      overview,
      explanation,
      pseudocode,
      codeSnippets,
      complexity,
      examples,
      visualizations,
      whyItMatters,
      realWorldApps,
      prerequisites,
      estimatedTime,
      isPublished,
      order,
      tags,
      relatedTopicIds
    } = req.body;

    // Check if slug already exists
    const existingTopic = await prisma.topic.findUnique({
      where: { slug }
    });

    if (existingTopic) {
      res.status(400).json({
        success: false,
        message: 'Slug already exists',
      });
      return;
    }

    const topic = await prisma.topic.create({
      data: {
        title,
        slug,
        description,
        category,
        difficulty,
        overview,
        explanation,
        pseudocode,
        codeSnippets: codeSnippets || [],
        complexity: complexity || {},
        examples: examples || [],
        visualizations: visualizations || [],
        whyItMatters,
        realWorldApps: realWorldApps || [],
        prerequisites: prerequisites || [],
        estimatedTime,
        isPublished: isPublished || false,
        order_index: order || 0,
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

    // Create related topic relationships if provided
    if (relatedTopicIds && relatedTopicIds.length > 0) {
      await prisma.topicRelation.createMany({
        data: relatedTopicIds.map((relatedId: string) => ({
          parentTopicId: topic.id,
          relatedTopicId: relatedId,
        })),
        skipDuplicates: true,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: { topic },
    });
  } catch (error) {
    console.error('Create topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update topic (admin/instructor only)
export const updateTopic = async (req: Request, res: Response): Promise<void> => {
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

    const existingTopic = await prisma.topic.findUnique({
      where: { id }
    });

    if (!existingTopic) {
      res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
      return;
    }

    const updateData = { ...req.body };
    delete updateData.relatedTopicIds; // Handle separately
    updateData.updatedById = userId;

    const topic = await prisma.topic.update({
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

    // Update related topics if provided
    if (req.body.relatedTopicIds !== undefined) {
      // Delete existing relations
      await prisma.topicRelation.deleteMany({
        where: { parentTopicId: id }
      });

      // Create new relations
      if (req.body.relatedTopicIds.length > 0) {
        await prisma.topicRelation.createMany({
          data: req.body.relatedTopicIds.map((relatedId: string) => ({
            parentTopicId: id,
            relatedTopicId: relatedId,
          })),
          skipDuplicates: true,
        });
      }
    }

    res.json({
      success: true,
      message: 'Topic updated successfully',
      data: { topic },
    });
  } catch (error) {
    console.error('Update topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete topic (admin/instructor only)
export const deleteTopic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const topic = await prisma.topic.findUnique({
      where: { id }
    });

    if (!topic) {
      res.status(404).json({
        success: false,
        message: 'Topic not found',
      });
      return;
    }

    await prisma.topic.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Topic deleted successfully',
    });
  } catch (error) {
    console.error('Delete topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};