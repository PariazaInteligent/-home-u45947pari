// DB Fix Script - Direct MySQL connection from Node.js
import mysql from 'mysql2/promise';

async function fixDatabase() {
    let connection;

    try {
        // Connect to database
        console.log('🔌 Connecting to database...');
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'u45947pari_api',
            password: '3DSecurity31',
            database: 'u45947pari_pariaza_inteligent',
            multipleStatements: true
        });

        console.log('✅ Connected!\n');

        // Step 1: Find foreign keys blocking snapshots
        console.log('=== STEP 1: Finding foreign keys ===');
        const [fks] = await connection.query(`
            SELECT 
                CONSTRAINT_NAME,
                TABLE_NAME,
                REFERENCED_TABLE_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_NAME = 'snapshots'
            AND TABLE_SCHEMA = 'u45947pari_pariaza_inteligent'
        `);

        for (const fk of fks) {
            console.log(`Found FK: ${fk.CONSTRAINT_NAME} on table ${fk.TABLE_NAME}`);
            await connection.query(`ALTER TABLE \`${fk.TABLE_NAME}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
            console.log(`✅ Dropped FK ${fk.CONSTRAINT_NAME}`);
        }

        // Step 2: Drop snapshots
        console.log('\n=== STEP 2: Dropping snapshots table ===');
        await connection.query('DROP TABLE IF EXISTS `snapshots`');
        console.log('✅ Snapshots table dropped');

        // Step 3: Recreate snapshots
        console.log('\n=== STEP 3: Recreating snapshots ===');
        await connection.query(`
            CREATE TABLE \`snapshots\` (
              \`id\` VARCHAR(191) NOT NULL,
              \`user_id\` VARCHAR(191) NOT NULL,
              \`snapshot_date\` DATE NOT NULL,
              \`principal_amount\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
              \`profit_net\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
              \`total_value\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
              \`share_percent\` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
              \`total_fund_value\` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
              \`created_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
              
              PRIMARY KEY (\`id\`),
              UNIQUE KEY \`snapshots_user_date_unique\` (\`user_id\`, \`snapshot_date\`),
              INDEX \`snapshots_user_id_idx\` (\`user_id\`),
              INDEX \`snapshots_date_idx\` (\`snapshot_date\`),
              
              CONSTRAINT \`snapshots_user_id_fkey\` 
                FOREIGN KEY (\`user_id\`) 
                REFERENCES \`users\`(\`id\`) 
                ON DELETE CASCADE 
                ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ Snapshots table recreated');

        // Step 4: Get admin user ID
        console.log('\n=== STEP 4: Finding admin user ===');
        const [users] = await connection.query("SELECT id, email FROM users WHERE email = 'admin@pariazainteligent.ro' LIMIT 1");
        let adminId;
        if (users.length > 0) {
            adminId = users[0].id;
            console.log(`✅ Admin user found: ${users[0].email} (ID: ${adminId})`);
        } else {
            const [firstUser] = await connection.query("SELECT id, email FROM users LIMIT 1");
            adminId = firstUser[0].id;
            console.log(`Using first user: ${firstUser[0].email} (ID: ${adminId})`);
        }

        // Step 5: Seed snapshots
        console.log('\n=== STEP 5: Seeding snapshots ===');
        const now = new Date();
        const snapshots = [
            { days: 30, principal: 5000, profit: -120, total: 4880, share: 2.14, fund: 228000 },
            { days: 20, principal: 5000, profit: 200.5, total: 5200.5, share: 2.23, fund: 233000 },
            { days: 10, principal: 5000, profit: 450.75, total: 5450.75, share: 2.28, fund: 239000 },
            { days: 0, principal: 5000, profit: 620, total: 5620, share: 2.30, fund: 244000 },
        ];

        for (const snap of snapshots) {
            const date = new Date(now);
            date.setDate(date.getDate() - snap.days);
            const dateStr = date.toISOString().split('T')[0];

            await connection.query(`
                INSERT INTO snapshots (id, user_id, snapshot_date, principal_amount, profit_net, total_value, share_percent, total_fund_value, created_at) 
                VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [adminId, dateStr, snap.principal, snap.profit, snap.total, snap.share, snap.fund]);

            console.log(`✅ Snapshot inserted: ${dateStr}`);
        }

        // Step 6: Update user stats
        console.log('\n=== STEP 6: Updating user stats ===');
        await connection.query(`
            UPDATE users SET 
                streak_days = 12,
                loyalty_points = 4200,
                tier = 'PRO',
                clearance_level = 2,
                last_checkin_at = DATE_SUB(NOW(), INTERVAL 1 DAY)
            WHERE id = ?
        `, [adminId]);
        console.log('✅ User stats updated (streak=12, points=4200, tier=PRO)');

        // Step 7: Insert payout method
        console.log('\n=== STEP 7: Adding payout method ===');
        const [existing] = await connection.query('SELECT COUNT(*) as cnt FROM payout_methods WHERE user_id = ?', [adminId]);
        if (existing[0].cnt === 0) {
            await connection.query(`
                INSERT INTO payout_methods (id, user_id, method_type, account_identifier, account_name, is_verified, is_primary, created_at) 
                VALUES (UUID(), ?, 'REVOLUT', '+40712***456', 'Admin User', 1, 1, NOW())
            `, [adminId]);
            console.log('✅ Payout method added');
        } else {
            console.log('ℹ️  Payout method already exists');
        }

        // Step 8: Verify
        console.log('\n=== STEP 8: Verification ===');
        const [snapCount] = await connection.query('SELECT COUNT(*) as cnt FROM snapshots WHERE user_id = ?', [adminId]);
        console.log(`✅ Snapshots count: ${snapCount[0].cnt}`);

        const [userStats] = await connection.query('SELECT streak_days, loyalty_points, tier FROM users WHERE id = ?', [adminId]);
        console.log(`✅ User stats: streak=${userStats[0].streak_days}, points=${userStats[0].loyalty_points}, tier=${userStats[0].tier}`);

        const [pmCount] = await connection.query('SELECT COUNT(*) as cnt FROM payout_methods WHERE user_id = ?', [adminId]);
        console.log(`✅ Payout methods: ${pmCount[0].cnt}`);

        console.log('\n=== ✅ ALL DONE - Database fixed and seeded ===');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixDatabase();
