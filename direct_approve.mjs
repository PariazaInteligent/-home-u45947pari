import { prisma } from '@pariaza/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Find pending user
const pendingUser = await prisma.user.findFirst({
    where: { status: 'PENDING_VERIFICATION' },
    select: { id: true, email: true, password: true }
});

if (!pendingUser) {
    console.log('❌ No pending user found');
    process.exit(1);
}

console.log(`✅ Found pending user: ${pendingUser.email} (${pendingUser.id})`);
console.log(`   Password before: ${pendingUser.password ? 'SET' : 'NULL'}`);

// Update to ACTIVE
await prisma.user.update({
    where: { id: pendingUser.id },
    data: { status: 'ACTIVE' }
});

// Generate set-password token
const token = crypto.randomBytes(32).toString('hex');
const tokenHash = await bcrypt.hash(token, 10);
const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60min

const resetToken = await prisma.passwordResetToken.create({
    data: {
        userId: pendingUser.id,
        tokenHash,
        expiresAt,
        purpose: 'SET_PASSWORD'
    }
});

console.log(`✅ User approved: status=ACTIVE`);
console.log(`✅ Token created: expires in 60min`);
console.log(`📧 Set-password link (EXAMPLE):`);
console.log(`   http://localhost:3000/set-password?token=${token.substring(0, 16)}...${token.substring(token.length - 4)}`);
console.log(`\n🔑 FULL TOKEN (for testing): ${token}`);

// Check DB state
const updatedUser = await prisma.user.findUnique({
    where: { id: pendingUser.id },
    select: { id: true, email: true, status: true, password: true }
});

const tokenCount = await prisma.passwordResetToken.count({
    where: { userId: pendingUser.id, purpose: 'SET_PASSWORD' }
});

console.log(`\n✅ DB VERIFICATION:`);
console.log(`   User status: ${updatedUser.status}`);
console.log(`   Password: ${updatedUser.password ? 'SET (has old hash)' : 'NULL'}`);
console.log(`   Password reset tokens: ${tokenCount}`);

await prisma.$disconnect();
