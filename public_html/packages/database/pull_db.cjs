
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

// Load env
const envPath = path.join(__dirname, '../../.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Failed to load env:', result.error);
    process.exit(1);
}

// Run prisma db pull
try {
    console.log('Running prisma db pull...');
    execSync('npx prisma db pull', { stdio: 'inherit', env: process.env });
    console.log('DB Pull Success!');
} catch (e) {
    console.error('DB Pull Failed:', e.message);
    process.exit(1);
}
