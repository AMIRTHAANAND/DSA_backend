import { PrismaClient, UserRole, AdminRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Hash passwords securely
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const instructorPassword = await bcrypt.hash('instructor123', 12);
    const studentPassword = await bcrypt.hash('student123', 12);

    // Create super admin with your email
    const superAdminAmirtha = await prisma.admin.upsert({
      where: { email: 'aamirtha1804@gmail.com' },
      update: {},
      create: {
        name: 'Amirtha',
        email: 'aamirtha1804@gmail.com',
        password: hashedPassword,
        role: AdminRole.SUPER_ADMIN,
        isApproved: true,
      },
    });

    console.log('✅ Created super admin:', superAdminAmirtha.email);

    // Create second super admin
    const superAdminNishwanth = await prisma.admin.upsert({
      where: { email: 'dknishwanth1718@gmail.com' },
      update: {},
      create: {
        name: 'Nishwanth',
        email: 'dknishwanth1718@gmail.com',
        password: hashedPassword,
        role: AdminRole.SUPER_ADMIN,
        isApproved: true,
      },
    });

    console.log('✅ Created second super admin:', superAdminNishwanth.email);

    // Create sample instructor
    const instructor = await prisma.user.upsert({
      where: { email: 'instructor@dsa-platform.com' },
      update: {},
      create: {
        username: 'instructor',
        email: 'instructor@dsa-platform.com',
        password: instructorPassword,
        firstName: 'John',
        lastName: 'Instructor',
        role: UserRole.INSTRUCTOR
        // isApproved: true,
      },
    });

    console.log('✅ Created instructor:', instructor.email);

    // Create sample student
    const student = await prisma.user.upsert({
      where: { email: 'student@dsa-platform.com' },
      update: {},
      create: {
        username: 'student',
        email: 'student@dsa-platform.com',
        password: studentPassword,
        firstName: 'Jane',
        lastName: 'Student',
        role: UserRole.STUDENT,
        // isApproved: true,
      },
    });

    console.log('✅ Created student:', student.email);
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Sample accounts created:');
    console.log('Super Admins:');
    console.log('- aamirtha1804@gmail.com / admin123');
    console.log('- dknishwanth1718@gmail.com / admin123');
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
