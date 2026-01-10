import { prisma } from './public_html/packages/database/dist/index.js';

async function main() {
    const email = 'admin@pariazainteligent.ro';
    console.log(`Checking admin user: ${email}`);

    const admin = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            status: true,
            password: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            role: true
        }
    });

    if (!admin) {
        console.log('❌ Admin user NOT FOUND.');
        process.exit(1);
    }

    console.log('✅ Admin found:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Password Set: ${!!admin.password}`);
    console.log(`   2FA Enabled: ${admin.twoFactorEnabled}`);
    console.log(`   2FA Secret Present: ${!!admin.twoFactorSecret}`);

    if (admin.twoFactorEnabled) {
        console.log('⚠️ 2FA is ENABLED. Disabling for local dev testing...');
        await prisma.user.update({
            where: { id: admin.id },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null // clearing secret to be sure
            }
        });
        console.log('✅ 2FA Disabled successfully.');
    } else {
        console.log('ℹ️ 2FA is already disabled.');
    }

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
