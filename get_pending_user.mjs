import { prisma } from '@pariaza/database';

const user = await prisma.user.findFirst({
    where: { status: 'PENDING_VERIFICATION' },
    select: { id: true, email: true, password: true }
});

console.log(JSON.stringify(user, null, 2));
await prisma.$disconnect();
