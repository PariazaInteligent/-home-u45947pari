import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from root
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const prisma = new PrismaClient();

async function checkTables() {
    try {
        console.log('Verifying tables...');

        // Check email_broadcasts (old table)
        try {
            const oldCount: any = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM email_broadcasts');
            console.log(`OLD Table 'email_broadcasts' count: ${Number(oldCount[0].count)}`);

            if (Number(oldCount[0].count) > 0) {
                const oldSample: any = await prisma.$queryRawUnsafe('SELECT * FROM email_broadcasts LIMIT 1');
                console.log('Sample from email_broadcasts columns:', Object.keys(oldSample[0]));
            }
        } catch (e) {
            console.log("Table 'email_broadcasts' query failed:", e.message);
        }

        // Check broadcasts (new table)
        try {
            const newCount: any = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM broadcasts');
            console.log(`NEW Table 'broadcasts' count: ${Number(newCount[0].count)}`);
        } catch (e) {
            console.log("Table 'broadcasts' query failed:", e.message);
        }

        // Check broadcast_analytics
        try {
            const analyticsCount: any = await prisma.$queryRawUnsafe('SELECT COUNT(*) as count FROM broadcast_analytics');
            console.log(`Analytics Table 'broadcast_analytics' count: ${Number(analyticsCount[0].count)}`);
        } catch (e) {
            console.log("Table 'broadcast_analytics' query failed:", e.message);
        }

    } catch (error) {
        console.error('General Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTables();
