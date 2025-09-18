import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function bootstrapSuperAdmin() {
  try {
    const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';
    const defaultEmails = ['dknishwanth1718@gmail.com', 'aamirtha1804@gmail.com'];
    const emailsEnv = (process.env.SUPER_ADMIN_EMAILS || '').trim();
    const emailSingleEnv = (process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim();
    const emails = emailsEnv
      ? emailsEnv.split(',').map(e => e.trim()).filter(Boolean)
      : (emailSingleEnv ? [emailSingleEnv] : defaultEmails);

    const password = process.env.SUPER_ADMIN_PASSWORD || 'dsa2025';

    if (!emails.length) {
      console.error('❌ No SUPER_ADMIN emails provided');
      process.exit(1);
    }

    if (!password) {
      console.error('❌ SUPER_ADMIN_PASSWORD is required');
      process.exit(1);
    }

    const hashed = await bcrypt.hash(password, 12);

    for (const email of emails) {
      console.log('🔎 Ensuring SUPER_ADMIN for:', email);
      const existing = await prisma.admin.findUnique({ where: { email } });

      if (!existing) {
        const created = await prisma.admin.create({
          data: {
            name,
            email,
            password: hashed,
            role: 'SUPER_ADMIN',
            isApproved: true,
          },
          select: { id: true, name: true, email: true, role: true, isApproved: true }
        });
        console.log('✅ Created SUPER_ADMIN:', created);
      } else {
        const updated = await prisma.admin.update({
          where: { email },
          data: {
            name: existing.name || name,
            password: hashed, // ensure known password
            role: 'SUPER_ADMIN',
            isApproved: true,
          },
          select: { id: true, name: true, email: true, role: true, isApproved: true }
        });
        console.log('✅ Ensured SUPER_ADMIN state:', updated);
      }
    }

    console.log('🎉 Super admin bootstrap completed.');
  } catch (err) {
    console.error('❌ Error bootstrapping super admin:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  bootstrapSuperAdmin().then(() => process.exit(0));
}
