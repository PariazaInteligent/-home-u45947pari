
import { PrismaClient, users_status, users_role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createPendingUser() {
    const email = 'test.admin.flow@example.com';
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Cleanup if exists
        await prisma.user.deleteMany({ where: { email } });

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: 'Test Admin Flow',
                status: users_status.PENDING_VERIFICATION,
                role: users_role.INVESTOR
            }
        });
        console.log('Pending user created:', user);
    } catch (error) {
        console.error('Error creating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createPendingUser();
