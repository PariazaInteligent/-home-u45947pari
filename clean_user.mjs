
import { prisma } from './public_html/packages/database/dist/index.js';

async function main() {
    const email = "tomizeimihaita@gmail.com";
    console.log(`Cleaning up user ${email}...`);

    try {
        const deleted = await prisma.user.deleteMany({
            where: { email }
        });
        console.log(`Deleted ${deleted.count} users.`);
    } catch (e) {
        console.error("Error cleaning user:", e);
    }
}

main();
