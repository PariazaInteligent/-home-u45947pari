import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify();
app.register(jwt, { secret: 'dev_secret_key_12345' });

// Read token
const tokenPath = path.join(__dirname, '../../../token_full.txt');
let token = '';
try {
    token = fs.readFileSync(tokenPath, 'utf8').trim();
} catch (e) {
    console.error('❌ Could not read token_full.txt:', e.message);
    process.exit(1);
}

console.log('🔍 Testing Token:', token.substring(0, 10) + '...');

app.ready(async () => {
    try {
        const decoded = app.jwt.verify(token);
        console.log('✅ Token VALID against secret "dev_secret_key_12345"');
        console.log('   Payload:', decoded);
    } catch (err) {
        console.error('❌ Token INVALID:', err.message);
        if (err.message === 'invalid signature') {
            console.log('   -> Signature mismatch! Server is NOT using "dev_secret_key_12345".');
        }
    }
    process.exit(0);
});
