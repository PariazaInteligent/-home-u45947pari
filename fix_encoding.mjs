import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read clean template
const cleanTemplate = fs.readFileSync(
    path.join(__dirname, 'pending_email_clean_utf8.txt'),
    'utf8'
);

// Read original email.service.ts
const emailServicePath = path.join(
    __dirname,
    'public_html/apps/api/src/services/email.service.ts'
);
let content = fs.readFileSync(emailServicePath, 'utf8');

// Find the start of sendPendingEmail method
const sendPendingStart = content.indexOf('async sendPendingEmail(user: EmailUser, ticketId: string)');
if (sendPendingStart === -1) {
    console.error('❌ Could not find sendPendingEmail method');
    process.exit(1);
}

// Find the end of getPendingEmailTemplate method
// Look for the closing of getPendingEmailTemplate which ends with return statement and closing brace
const getPendingTemplateStart = content.indexOf('private getPendingEmailTemplate(user: EmailUser, ticketId: string)');
if (getPendingTemplateStart === -1) {
    console.error('❌ Could not find getPendingEmailTemplate method');
    process.exit(1);
}

// Find the end: look for the next method after getPendingEmailTemplate
// Search for "private getActivationEmailTemplate" to find where getPendingEmailTemplate ends
const nextMethodStart = content.indexOf('private getActivationEmailTemplate(user: EmailUser', getPendingTemplateStart);
if (nextMethodStart === -1) {
    console.error('❌ Could not find end of getPendingEmailTemplate method');
    process.exit(1);
}

// Backtrack to find the closing brace before nextMethodStart
let endPos = nextMethodStart - 1;
while (endPos > getPendingTemplateStart && content[endPos].trim() === '') {
    endPos--;
}
// Now endPos should be right before the next method

// The block to replace is from sendPendingStart to endPos
const before = content.substring(0, sendPendingStart);
const after = content.substring(endPos + 1);

// Construct new content
const newContent = before + cleanTemplate + '\n\n' + after;

// Write back as UTF-8
fs.writeFileSync(emailServicePath, newContent, 'utf8');

console.log('✅ Successfully replaced sendPendingEmail and getPendingEmailTemplate');
console.log('📍 Replaced block from char', sendPendingStart, 'to', endPos);
