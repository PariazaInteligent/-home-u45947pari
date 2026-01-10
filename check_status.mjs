
import { prisma } from './public_html/packages/database/dist/index.js';

async function main() {
    const userId = "cmjmxo3eo0007ppgdci1rnud2";

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { status: true, email: true, password: true }
    });

    console.log(`User ${userId}:`);
    console.log(`Status: ${user.status}`);
    console.log(`Password: ${user.password}`);

    const tokens = await prisma.passwordResetToken.findMany({
        where: { userId },
        select: { purpose: true, createdAt: true }
    });

    console.log(`Tokens: ${tokens.length}`);
    tokens.forEach(t => console.log(` - ${t.purpose} (${t.createdAt})`));
}

main().catch(console.error);
