
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAdminLogin() {
    const email = 'admin@pariazainteligent.ro';
    const password = 'admin2025';

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log('Admin user not found');
        return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log(`Admin Password Valid: ${validPassword}`);

    await prisma.$disconnect();
}

checkAdminLogin();
