
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkLogin() {
    const email = 'test.user2.123456@example.com';
    const password = 'Password123!';

    // Simulate login logic from auth.routes.ts
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('User not found');
        return;
    }

    if (user.status !== 'ACTIVE') {
        console.log(`LOGIN BLOCKED: User status is ${user.status}`);
    } else {
        console.log('LOGIN ALLOWED (Unexpected)');
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log(`Password Valid: ${validPassword}`);

    await prisma.$disconnect();
}

checkLogin();
