import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'superadmin@trucknet.com';
  const password = 'adminpassword123';
  const phone = '0000000000'; // Dummy phone

  const existingAdmin = await prisma.user.findUnique({ where: { email } });

  if (existingAdmin) {
    console.log('Admin user already exists!');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const adminUser = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email,
      phone,
      password: hashedPassword,
      role: 'ADMIN',
      isVerified: true,
    },
  });

  console.log('Successfully created admin user:');
  console.log(`Email: ${adminUser.email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
