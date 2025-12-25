
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findAdmin() {
    try {
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
        });
        console.log('Admin found:', admin);
        console.log('Admin Email:', admin?.email);
    } catch (error) {
        console.error('Error finding admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

findAdmin();
