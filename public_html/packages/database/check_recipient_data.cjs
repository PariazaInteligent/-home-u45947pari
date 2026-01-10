require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });
const mysql = require('mysql2/promise');

async function checkRecipientData() {
    let connection;
    try {
        connection = await mysql.createConnection(process.env.DATABASE_URL);

        console.log('🔍 Checking recipient data in broadcasts table...\n');

        // Check all broadcasts
        const [broadcasts] = await connection.execute(`
      SELECT 
        id, 
        subject, 
        recipient_user_ids,
        LENGTH(recipient_user_ids) as id_length,
        sent_at
      FROM broadcasts
      ORDER BY sent_at DESC
      LIMIT 5
    `);

        console.log('📊 Recent 5 broadcasts:');
        broadcasts.forEach((b, i) => {
            console.log(`\n${i + 1}. ID: ${b.id}`);
            console.log(`   Subject: ${b.subject}`);
            console.log(`   Sent At: ${b.sent_at}`);
            console.log(`   recipient_user_ids: ${b.recipient_user_ids}`);
            console.log(`   Length: ${b.id_length}`);

            // Try to parse JSON if it looks like JSON
            if (b.recipient_user_ids) {
                try {
                    const parsed = JSON.parse(b.recipient_user_ids);
                    console.log(`   Parsed Count: ${Array.isArray(parsed) ? parsed.length : 'not an array'}`);
                } catch (e) {
                    console.log(`   Parse Error: ${e.message}`);
                }
            }
        });

        // Count broadcasts with/without recipient data
        const [counts] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN recipient_user_ids IS NULL OR recipient_user_ids = '' THEN 1 ELSE 0 END) as without_recipients,
        SUM(CASE WHEN recipient_user_ids IS NOT NULL AND recipient_user_ids != '' THEN 1 ELSE 0 END) as with_recipients
      FROM broadcasts
    `);

        console.log('\n\n📈 Summary:');
        console.log(`Total broadcasts: ${counts[0].total}`);
        console.log(`Without recipients: ${counts[0].without_recipients}`);
        console.log(`With recipients: ${counts[0].with_recipients}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkRecipientData();
