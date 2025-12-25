
import { PrismaClient, users_role, users_status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@pariazainteligent.ro';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password: hashedPassword,
            status: users_status.ACTIVE,
            role: users_role.ADMIN,
        },
        create: {
            email,
            password: hashedPassword,
            name: 'Admin User',
            role: users_role.ADMIN,
            status: users_status.ACTIVE,
        },
    });

    console.log(`User ${user.email} created/updated with password: ${password}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
