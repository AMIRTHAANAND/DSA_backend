import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create super admin
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const superAdmin = await prisma.admin.upsert({
      where: { email: 'dknishwanth1718@gmail.com' },
      update: {},
      create: {
        name: 'Nishwanth DK',
        email: 'dknishwanth1718@gmail.com',
        password: hashedPassword,
        role: 'SUPER_ADMIN',
        isApproved: true,
      },
    });

    console.log('✅ Created super admin:', superAdmin.email);

    // Create sample instructor
    const instructorPassword = await bcrypt.hash('instructor123', 12);

    const instructor = await prisma.user.upsert({
      where: { email: 'instructor@dsa-platform.com' },
      update: {},
      create: {
        username: 'instructor',
        email: 'instructor@dsa-platform.com',
        password: instructorPassword,
        firstName: 'John',
        lastName: 'Instructor',
        role: 'INSTRUCTOR',
      },
    });

    console.log('✅ Created instructor:', instructor.email);

    // Create sample student
    const studentPassword = await bcrypt.hash('student123', 12);

    const student = await prisma.user.upsert({
      where: { email: 'student@dsa-platform.com' },
      update: {},
      create: {
        username: 'student',
        email: 'student@dsa-platform.com',
        password: studentPassword,
        firstName: 'Jane',
        lastName: 'Student',
        role: 'STUDENT',
      },
    });

    console.log('✅ Created student:', student.email);

    // Create sample topics
    const arraysTopic = await prisma.topic.upsert({
      where: { slug: 'arrays-introduction' },
      update: {},
      create: {
        title: 'Introduction to Arrays',
        slug: 'arrays-introduction',
        description: 'Learn the fundamentals of arrays, one of the most basic data structures.',
        category: 'DATA_STRUCTURES',
        difficulty: 'BEGINNER',
        overview: 'Arrays are a fundamental data structure that stores elements in contiguous memory locations.',
        explanation: 'An array is a collection of elements stored at contiguous memory locations. The idea is to store multiple items of the same type together.',
        pseudocode: `
DECLARE array[size]
FOR i = 0 to size-1
    array[i] = value
END FOR
        `,
        codeSnippets: [
          {
            language: 'javascript',
            code: 'const arr = [1, 2, 3, 4, 5];\nconsole.log(arr[0]); // 1',
            explanation: 'Creating and accessing array elements in JavaScript'
          }
        ],
        complexity: {
          time: 'O(1) for access, O(n) for search',
          space: 'O(n)'
        },
        examples: ['[1, 2, 3, 4, 5]', '[\"apple\", \"banana\", \"cherry\"]'],
        visualizations: [],
        whyItMatters: 'Arrays are the building blocks for more complex data structures and algorithms.',
        realWorldApps: ['Database records', 'Image pixels', 'Shopping cart items'],
        prerequisites: ['Basic programming concepts'],
        estimatedTime: 30,
        isPublished: true,
        order: 1,
        tags: ['arrays', 'data-structures', 'beginner'],
        createdById: instructor.id,
        updatedById: instructor.id,
      },
    });

    console.log('✅ Created topic:', arraysTopic.title);

    // Create sample assignment
    const assignment = await prisma.assignment.upsert({
      where: { id: 'sample-assignment-id' },
      update: {},
      create: {
        id: 'sample-assignment-id',
        title: 'Two Sum Problem',
        description: 'Find two numbers in an array that add up to a target sum.',
        problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        difficulty: 'EASY',
        category: 'ARRAYS',
        constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
        examples: [
          {
            input: 'nums = [2,7,11,15], target = 9',
            output: '[0,1]',
            explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
          }
        ],
        testCases: [
          {
            input: { nums: [2, 7, 11, 15], target: 9 },
            expectedOutput: [0, 1],
            isHidden: false
          },
          {
            input: { nums: [3, 2, 4], target: 6 },
            expectedOutput: [1, 2],
            isHidden: true
          }
        ],
        starterCode: [
          {
            language: 'javascript',
            code: 'function twoSum(nums, target) {\n    // Your code here\n}'
          }
        ],
        solution: [
          {
            language: 'javascript',
            code: 'function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}',
            explanation: 'Use a hash map to store numbers and their indices, then look for the complement.'
          }
        ],
        hints: ['Try using a hash map', 'Look for the complement of each number'],
        timeLimit: 1000,
        memoryLimit: 128,
        points: 10,
        isPublished: true,
        tags: ['arrays', 'hash-table', 'easy'],
        createdById: instructor.id,
        updatedById: instructor.id,
      },
    });

    console.log('✅ Created assignment:', assignment.title);

    // Create sample quiz
    const quiz = await prisma.quiz.upsert({
      where: { id: 'sample-quiz-id' },
      update: {},
      create: {
        id: 'sample-quiz-id',
        title: 'Arrays Basics Quiz',
        description: 'Test your knowledge of array fundamentals.',
        category: 'DATA_STRUCTURES',
        difficulty: 'BEGINNER',
        questions: [
          {
            question: 'What is the time complexity of accessing an element in an array by index?',
            type: 'multiple-choice',
            options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
            correctAnswer: 'O(1)',
            explanation: 'Array access by index is constant time because elements are stored in contiguous memory.',
            points: 1,
            difficulty: 'easy',
            tags: ['time-complexity', 'arrays']
          },
          {
            question: 'Arrays in most programming languages have a fixed size.',
            type: 'true-false',
            correctAnswer: 'true',
            explanation: 'Traditional arrays have a fixed size, though dynamic arrays can resize.',
            points: 1,
            difficulty: 'easy',
            tags: ['arrays', 'memory']
          }
        ],
        timeLimit: 10,
        passingScore: 70,
        maxAttempts: 3,
        isPublished: true,
        tags: ['arrays', 'quiz', 'beginner'],
        createdById: instructor.id,
        updatedById: instructor.id,
      },
    });

    console.log('✅ Created quiz:', quiz.title);

    // Create progress for student
    await prisma.progress.upsert({
      where: { id: 'sample-progress-id' },
      update: {},
      create: {
        id: 'sample-progress-id',
        userId: student.id,
        totalTopics: 1,
        totalAssignments: 1,
        totalQuizzes: 1,
      },
    });

    console.log('✅ Created progress record for student');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample accounts created:');
    console.log('Super Admin: dknishwanth1718@gmail.com / admin123');
    console.log('Instructor: instructor@dsa-platform.com / instructor123');
    console.log('Student: student@dsa-platform.com / student123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });