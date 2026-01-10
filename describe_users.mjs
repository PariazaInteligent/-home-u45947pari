// Verify MySQL column names for users table
import mysql from 'mysql2/promise';

async function describeUsers() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'u45947pari_api',
            password: '3DSecurity31',
            database: 'u45947pari_pariaza_inteligent'
        });

        console.log('=== DESCRIBE users (relevant columns) ===\n');

        const [rows] = await connection.query('DESCRIBE users');

        console.log('Field                        | Type                  | Null | Key | Default');
        console.log('---------------------------- | --------------------- | ---- | --- | -------');

        rows.forEach(row => {
            const field = row.Field;
            // Filter for timestamp and gamification fields
            if (
                field.includes('created') ||
                field.includes('updated') ||
                field.includes('streak') ||
                field.includes('loyalty') ||
                field.includes('tier') ||
                field.includes('clearance') ||
                field.includes('checkin') ||
                field.includes('two_factor') ||
                field.includes('twoFactor') ||
                field.includes('last_login') ||
                field.includes('lastLogin')
            ) {
                console.log(`${field.padEnd(28)} | ${row.Type.padEnd(21)} | ${row.Null.padEnd(4)} | ${(row.Key || '').padEnd(3)} | ${row.Default || 'NULL'}`);
            }
        });

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

describeUsers();
