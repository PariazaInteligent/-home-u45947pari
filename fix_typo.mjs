import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const emailServicePath = path.join(
    __dirname,
    'public_html/apps/api/src/services/email.service.ts'
);

let content = fs.readFileSync(emailServicePath, 'utf8');

// Fix typo: "ticket Id" -> "ticketId"
content = content.replace(
    'async sendPendingEmail(user: EmailUser, ticket Id: string)',
    'async sendPendingEmail(user: EmailUser, ticketId: string)'
);

fs.writeFileSync(emailServicePath, content, 'utf8');

console.log('✅ Fixed ticketId typo');
