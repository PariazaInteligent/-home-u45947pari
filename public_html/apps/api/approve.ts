import { prisma } from '@pariaza/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function approveUser() {
  // Find pend

ing user
    const pendingUser = await prisma.user.findFirst({
        where: { status: 'PENDING_VERIFICATION' },
        select: { id: true, email: true, password: true }
    });

    if (!pendingUser) {
        console.log('❌ No pending user found');
        process.exit(1);
    }

    console.log(`✅ Found: ${pendingUser.email}`);
    console.log(`   Password: ${pendingUser.password ? 'SET' : 'NULL'}`);

    // Approve
    await prisma.user.update({
        where: { id: pendingUser.id },
        data: { status: 'ACTIVE' }
    });

    // Token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    await prisma.passwordResetToken.create({
        data: {
            userId: pendingUser.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            purpose: 'SET_PASSWORD'
        }
    });

    console.log(`✅ APPROVED: ${pendingUser.email}`);
    console.log(`🔗 Token: ${token.substring(0, 16)}...`);
    console.log(`📧 Sending activation email to tomizeimihaita@gmail.com...`);

    await prisma.$disconnect();
    return { userId: pendingUser.id, token, email: pendingUser.email };
}

approveUser().then(console.log).catch(console.error);
