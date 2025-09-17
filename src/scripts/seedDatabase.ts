import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await prisma.progress.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.admin.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Cleared existing data');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await prisma.user.createMany({
      data: [
        {
          username: 'john_doe',
          email: 'john@example.com',
          password: hashedPassword,
          firstName: 'John',
          lastName: 'Doe',
          role: 'STUDENT',
          isActive: true,
        },
        {
          username: 'jane_smith',
          email: 'jane@example.com',
          password: hashedPassword,
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'STUDENT',
          isActive: true,
        },
        {
          username: 'admin_user',
          email: 'admin@example.com',
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          isActive: true,
        },
        {
          username: 'instructor_user',
          email: 'instructor@example.com',
          password: hashedPassword,
          firstName: 'Instructor',
          lastName: 'User',
          role: 'INSTRUCTOR',
          isActive: true,
        },
      ],
    });

    console.log('✅ Created users');

    // Fetch admin user id for relations
    const admin = await prisma.user.findUnique({ where: { email: 'admin@example.com' }, select: { id: true } });
    if (!admin) throw new Error('Admin user not found after creation');

    // Create topics
    const topics = await prisma.topic.createMany({
      data: [
        {
          title: 'Arrays and Strings',
          slug: 'arrays-and-strings',
          description: 'Learn about arrays and string manipulation in programming.',
          overview: 'This topic covers fundamental concepts of arrays and strings...',
          difficulty: 'BEGINNER',
          category: 'DATA_STRUCTURES',
          estimatedTime: 120,
          isPublished: true,
          createdById: admin.id,
          updatedById: admin.id,
        },
        {
          title: 'Linked Lists',
          slug: 'linked-lists',
          description: 'Understanding linked list data structure and its operations.',
          overview: 'Linked lists are linear data structures...',
          difficulty: 'INTERMEDIATE',
          category: 'DATA_STRUCTURES',
          estimatedTime: 180,
          isPublished: true,
          createdById: admin.id,
          updatedById: admin.id,
        },
        {
          title: 'Binary Trees',
          slug: 'binary-trees',
          description: 'Learn about binary tree data structures and tree traversal.',
          overview: 'Binary trees are hierarchical data structures...',
          difficulty: 'ADVANCED',
          category: 'DATA_STRUCTURES',
          estimatedTime: 240,
          isPublished: true,
          createdById: admin.id,
          updatedById: admin.id,
        },
        {
          title: 'Sorting Algorithms',
          slug: 'sorting-algorithms',
          description: 'Understanding various sorting algorithms and their complexities.',
          overview: 'Sorting algorithms are fundamental in computer science...',
          difficulty: 'INTERMEDIATE',
          category: 'ALGORITHMS',
          estimatedTime: 200,
          isPublished: true,
          createdById: admin.id,
          updatedById: admin.id,
        },
        {
          title: 'Dynamic Programming',
          slug: 'dynamic-programming',
          description: 'Learn dynamic programming concepts and problem-solving techniques.',
          overview: 'Dynamic programming is a method for solving complex problems...',
          difficulty: 'ADVANCED',
          category: 'ALGORITHMS',
          estimatedTime: 300,
          isPublished: true,
          createdById: admin.id,
          updatedById: admin.id,
        },
      ],
    });

    console.log('✅ Created topics');

    // Create assignments
    const assignments = await prisma.assignment.createMany({
      data: [
        {
          title: 'Array Rotation',
          description: 'Implement array rotation algorithm.',
          problemStatement: 'Write a function to rotate an array by k positions.',
          difficulty: 'EASY',
          category: 'ARRAYS',
          timeLimit: 30,
          isPublished: true,
          createdById: admin.id,
          updatedById: admin.id,
        },
        {
          title: 'Reverse Linked List',
          description: 'Reverse a singly linked list.',
          problemStatement: 'Implement a function to reverse a linked list in-place.',
          difficulty: 'MEDIUM',
          category: 'LINKED_LISTS',
          timeLimit: 45,
          isPublished: true,
          createdById: admin.id,
          updatedById: admin.id,
        },
        {
          title: 'Binary Tree Traversal',
          description: 'Implement different tree traversal methods.',
          problemStatement: 'Implement preorder, inorder, and postorder traversal.',
          difficulty: 'HARD',
          category: 'TREES',
          timeLimit: 60,
          isPublished: true,
          createdById: admin.id,
          updatedById: admin.id,
        },
      ],
    });

    console.log('✅ Created assignments');

    // Create quizzes
    const quizzes = await prisma.quiz.createMany({
      data: [
        {
          title: 'Arrays Fundamentals Quiz',
          description: 'Test your knowledge of array operations.',
          difficulty: 'BEGINNER',
          category: 'DATA_STRUCTURES',
          timeLimit: 15,
          passingScore: 70,
          maxAttempts: 3,
          isPublished: true,
          createdById: admin.id,
          questions: [
            {
              question: 'What is the time complexity of accessing an element in an array?',
              options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
              correctAnswer: 0,
              points: 1,
            },
            {
              question: 'Which method adds an element to the end of an array?',
              options: ['push()', 'pop()', 'shift()', 'unshift()'],
              correctAnswer: 0,
              points: 1,
            },
          ],
        },
        {
          title: 'Linked Lists Quiz',
          description: 'Test your understanding of linked list concepts.',
          difficulty: 'INTERMEDIATE',
          category: 'DATA_STRUCTURES',
          timeLimit: 20,
          passingScore: 75,
          maxAttempts: 3,
          isPublished: true,
          createdById: admin.id,
          questions: [
            {
              question: 'What is the main advantage of linked lists over arrays?',
              options: ['Faster access', 'Dynamic size', 'Less memory', 'Better sorting'],
              correctAnswer: 1,
              points: 1,
            },
            {
              question: 'What is the time complexity of inserting at the beginning of a linked list?',
              options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
              correctAnswer: 0,
              points: 1,
            },
          ],
        },
      ],
    });

    console.log('✅ Created quizzes');

    console.log('🎉 Database seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.count}`);
    console.log(`   - Topics: ${topics.count}`);
    console.log(`   - Assignments: ${assignments.count}`);
    console.log(`   - Quizzes: ${quizzes.count}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;