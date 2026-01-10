
import { prisma } from './public_html/packages/database/dist/index.js';
import fs from 'fs';
import path from 'path';

async function main() {
    let userId = "";
    // Hardcode known ID if file read fails, or just use email lookup
    const user = await prisma.user.findUnique({
        where: { email: "tomizeimihaita@gmail.com" },
        select: { id: true, status: true, email: true, password: true }
    });

    if (!user) {
        console.error("User not found!");
        process.exit(1);
    }

    console.log(`User ${user.email} (${user.id})`);
    console.log(`Status: ${user.status}`);
    console.log(`Password Hash: ${user.password ? user.password.substring(0, 20) + '...' : 'NULL'}`);

    const tokens = await prisma.passwordResetToken.findMany({
        where: { userId: user.id },
        select: { purpose: true, createdAt: true, expiresAt: true, usedAt: true }
    });

    console.log(`Tokens: ${tokens.length}`);
    tokens.forEach(t => {
        console.log(` - ${t.purpose}`);
        console.log(`   Created: ${t.createdAt}`);
        console.log(`   Expires: ${t.expiresAt}`);
        console.log(`   UsedAt:  ${t.usedAt ? t.usedAt : 'NULL/UNDEFINED'}`);
    });
}

main().catch(console.error);
