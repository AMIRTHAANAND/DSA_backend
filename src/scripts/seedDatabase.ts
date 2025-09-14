<<<<<<< HEAD
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
=======
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import Topic from '../models/Topic';
import Assignment from '../models/Assignment';
import Quiz from '../models/Quiz';

// Load environment variables
dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa_learning_platform';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@dsa-platform.com' });
    if (existingAdmin) {
      console.log('👤 Admin user already exists, skipping...');
      return existingAdmin;
    }

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@dsa-platform.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });

    console.log('👤 Admin user created:', adminUser.email);
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

const seedTopics = async (adminUser: any) => {
  try {
    // Check if topics already exist
    const existingTopics = await Topic.countDocuments();
    if (existingTopics > 0) {
      console.log('📚 Topics already exist, skipping...');
      return;
    }

    const topics = [
      {
        title: 'Arrays and Strings',
        slug: 'arrays-and-strings',
        description: 'Learn about arrays and string manipulation techniques',
        category: 'data-structures',
        difficulty: 'beginner',
        content: {
          overview: 'Arrays and strings are fundamental data structures in programming.',
          explanation: 'Arrays are collections of elements stored in contiguous memory locations...',
          pseudocode: 'Algorithm: Array Traversal\n1. Initialize index = 0\n2. While index < array.length\n3. Process array[index]\n4. Increment index',
          codeSnippets: [
            {
              language: 'javascript',
              code: 'const arr = [1, 2, 3, 4, 5];\nfor (let i = 0; i < arr.length; i++) {\n  console.log(arr[i]);\n}',
              explanation: 'Basic array traversal using for loop'
            }
          ],
          complexity: {
            time: 'O(n)',
            space: 'O(1)',
            bestCase: 'O(1)',
            worstCase: 'O(n)',
            averageCase: 'O(n)'
          },
          examples: ['Array traversal', 'String manipulation', 'Searching elements'],
          visualizations: [],
          whyItMatters: 'Arrays and strings are used in almost every programming problem.',
          realWorldApplications: ['Data processing', 'Text analysis', 'Game development']
        },
        prerequisites: ['Basic programming knowledge'],
        estimatedTime: 30,
        isPublished: true,
        order: 1,
        tags: ['arrays', 'strings', 'basics'],
        createdBy: adminUser._id,
        updatedBy: adminUser._id
      },
      {
        title: 'Linked Lists',
        slug: 'linked-lists',
        description: 'Understanding linked list data structure and operations',
        category: 'data-structures',
        difficulty: 'intermediate',
        content: {
          overview: 'Linked lists are linear data structures where elements are stored in nodes.',
          explanation: 'Each node contains data and a reference to the next node...',
          pseudocode: 'Algorithm: Insert at Beginning\n1. Create new node\n2. Set new node next to head\n3. Update head to new node',
          codeSnippets: [
            {
              language: 'javascript',
              code: 'class Node {\n  constructor(data) {\n    this.data = data;\n    this.next = null;\n  }\n}',
              explanation: 'Node class for linked list'
            }
          ],
          complexity: {
            time: 'O(1) for insertion at beginning',
            space: 'O(n)',
            bestCase: 'O(1)',
            worstCase: 'O(n)',
            averageCase: 'O(n)'
          },
          examples: ['Insertion', 'Deletion', 'Traversal'],
          visualizations: [],
          whyItMatters: 'Linked lists are efficient for dynamic memory allocation.',
          realWorldApplications: ['Memory management', 'Undo functionality', 'Browser history']
        },
        prerequisites: ['Arrays and Strings'],
        estimatedTime: 45,
        isPublished: true,
        order: 2,
        tags: ['linked-lists', 'dynamic-memory', 'pointers'],
        createdBy: adminUser._id,
        updatedBy: adminUser._id
      }
    ];

    await Topic.insertMany(topics);
    console.log('📚 Sample topics created successfully');
  } catch (error) {
    console.error('❌ Error creating topics:', error);
    throw error;
  }
};

const seedAssignments = async (adminUser: any) => {
  try {
    // Check if assignments already exist
    const existingAssignments = await Assignment.countDocuments();
    if (existingAssignments > 0) {
      console.log('📝 Assignments already exist, skipping...');
      return;
    }

    const assignments = [
      {
        title: 'Reverse Array',
        description: 'Write a function to reverse an array in-place',
        problemStatement: 'Given an array of integers, reverse the array in-place without using extra space.',
        difficulty: 'easy',
        category: 'arrays',
        constraints: ['Do not use extra space', 'Array length <= 10^5'],
        examples: [
          {
            input: '[1, 2, 3, 4, 5]',
            output: '[5, 4, 3, 2, 1]',
            explanation: 'Reverse the order of elements'
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
          }
        ],
        testCases: [
          {
<<<<<<< HEAD
            input: { nums: [2, 7, 11, 15], target: 9 },
            expectedOutput: [0, 1],
            isHidden: false
          },
          {
            input: { nums: [3, 2, 4], target: 6 },
            expectedOutput: [1, 2],
            isHidden: true
=======
            input: [1, 2, 3, 4, 5],
            expectedOutput: [5, 4, 3, 2, 1],
            description: 'Basic test case'
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
          }
        ],
        starterCode: [
          {
            language: 'javascript',
<<<<<<< HEAD
            code: 'function twoSum(nums, target) {\n    // Your code here\n}'
=======
            code: 'function reverseArray(arr) {\n  // Your code here\n}'
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
          }
        ],
        solution: [
          {
            language: 'javascript',
<<<<<<< HEAD
            code: 'function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}',
            explanation: 'Use a hash map to store numbers and their indices, then look for the complement.'
          }
        ],
        hints: ['Try using a hash map', 'Look for the complement of each number'],
=======
            code: 'function reverseArray(arr) {\n  let left = 0;\n  let right = arr.length - 1;\n  while (left < right) {\n    [arr[left], arr[right]] = [arr[right], arr[left]];\n    left++;\n    right--;\n  }\n  return arr;\n}',
            explanation: 'Use two pointers to swap elements from both ends'
          }
        ],
        hints: ['Think about using two pointers', 'Consider swapping elements'],
>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
        timeLimit: 1000,
        memoryLimit: 128,
        points: 10,
        isPublished: true,
<<<<<<< HEAD
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
=======
        tags: ['arrays', 'two-pointers', 'easy'],
        createdBy: adminUser._id,
        updatedBy: adminUser._id
      }
    ];

    await Assignment.insertMany(assignments);
    console.log('📝 Sample assignments created successfully');
  } catch (error) {
    console.error('❌ Error creating assignments:', error);
    throw error;
  }
};

const seedQuizzes = async (adminUser: any) => {
  try {
    // Check if quizzes already exist
    const existingQuizzes = await Quiz.countDocuments();
    if (existingQuizzes > 0) {
      console.log('🧠 Quizzes already exist, skipping...');
      return;
    }

    const quizzes = [
      {
        title: 'Data Structures Basics',
        description: 'Test your knowledge of fundamental data structures',
        category: 'data-structures',
        difficulty: 'beginner',
        questions: [
          {
            question: 'What is the time complexity of accessing an element in an array?',
            type: 'multiple-choice',
            options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
            correctAnswer: 'O(1)',
            explanation: 'Array access is constant time O(1) as we can directly access any index.',
            points: 5,
            difficulty: 'easy',
            tags: ['arrays', 'time-complexity']
          },
          {
            question: 'Which data structure follows LIFO principle?',
            type: 'multiple-choice',
            options: ['Queue', 'Stack', 'Linked List', 'Tree'],
            correctAnswer: 'Stack',
            explanation: 'Stack follows Last In First Out (LIFO) principle.',
            points: 5,
            difficulty: 'easy',
            tags: ['stacks', 'lifo']
          }
        ],
        timeLimit: 15,
        passingScore: 70,
        maxAttempts: 3,
        isPublished: true,
        tags: ['basics', 'data-structures'],
        createdBy: adminUser._id,
        updatedBy: adminUser._id
      }
    ];

    await Quiz.insertMany(quizzes);
    console.log('🧠 Sample quizzes created successfully');
  } catch (error) {
    console.error('❌ Error creating quizzes:', error);
    throw error;
  }
};

const main = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Seed data
    const adminUser = await seedUsers();
    await seedTopics(adminUser);
    await seedAssignments(adminUser);
    await seedQuizzes(adminUser);
    
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Sample data created:');
    console.log('- Admin user: admin@dsa-platform.com (password: admin123)');
    console.log('- 2 sample topics');
    console.log('- 1 sample assignment');
    console.log('- 1 sample quiz');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seeder
main();

>>>>>>> 6a237b314cc6801134bc078ae9128882a249b6b6
