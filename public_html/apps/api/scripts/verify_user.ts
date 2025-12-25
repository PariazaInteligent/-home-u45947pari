
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLastUser() {
    try {
        const user = await prisma.user.findFirst({
            orderBy: { createdAt: 'desc' },
        });
        console.log('Last User:', user);
    } catch (error) {
        console.error('Error fetching user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkLastUser();
