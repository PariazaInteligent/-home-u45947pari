import { prisma } from '@pariaza/database';

async function createBroadcastsTable() {
    console.log('🔄 Creating broadcasts table for transparency...');

    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS broadcasts (
                id VARCHAR(100) PRIMARY KEY,
                analytics_id VARCHAR(100) UNIQUE,
                template_id VARCHAR(50) NOT NULL,
                subject VARCHAR(500) NOT NULL,
                message_text TEXT NOT NULL,
                html_content TEXT,
                sent_by_user_id VARCHAR(100),
                sent_by_name VARCHAR(200),
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                recipient_filter JSON,
                recipient_user_ids JSON NOT NULL,
                
                FOREIGN KEY (analytics_id) REFERENCES broadcast_analytics(id) ON DELETE SET NULL,
                INDEX idx_sent_at (sent_at DESC),
                INDEX idx_template (template_id),
                INDEX idx_sent_by (sent_by_user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('✅ broadcasts table created successfully!');

        // Verify
        const result: any[] = await prisma.$queryRawUnsafe(`
            SHOW TABLES LIKE 'broadcasts'
        `);

        if (result.length > 0) {
            console.log('✓ Table verified in database');

            // Show structure
            const structure: any[] = await prisma.$queryRawUnsafe(`DESCRIBE broadcasts`);
            console.log('\n📋 Table Structure:');
            console.table(structure);
        }

    } catch (error) {
        console.error('❌ Error creating table:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createBroadcastsTable();
