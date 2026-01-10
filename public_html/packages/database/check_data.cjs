
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load env explicitly
const envPath = path.join(__dirname, '../../.env.local');
console.log('Loading env from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env file:', result.error);
} else {
    console.log('Env loaded successfully.');
    // Debug print (masked)
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 10) : 'undefined');
}

const prisma = new PrismaClient();

async function describeTable() {
    try {
        console.log('Describing email_broadcasts...');
        const columns = await prisma.$queryRawUnsafe('DESCRIBE email_broadcasts');
        console.log('Columns:', JSON.stringify(columns, null, 2));
    } catch (error) {
        console.error('Error describing table:', error);
    } finally {
        await prisma.$disconnect();
    }
}

describeTable();
