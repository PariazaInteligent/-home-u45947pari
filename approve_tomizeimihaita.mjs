
const doFetch = fetch;
import fs from 'fs';

async function main() {
    const adminEmail = "admin@pariazainteligent.ro";
    const adminPass = "password123";

    let pendingUserId = "";
    try {
        pendingUserId = fs.readFileSync('current_user_id.txt', 'utf8').trim();
    } catch (e) {
        console.error("Could not read current_user_id.txt");
        process.exit(1);
    }

    console.log(`🔹 1. Logging in as ${adminEmail}...`);

    const loginRes = await doFetch("http://localhost:3001/auth/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPass })
    });

    if (!loginRes.ok) {
        console.error(`❌ Login Failed: ${loginRes.status}`);
        process.exit(1);
    }

    const loginData = await loginRes.json();
    const token = loginData.accessToken;

    console.log(`✅ Login OK. Approving user ${pendingUserId}...`);

    const approveRes = await doFetch(`http://localhost:3001/admin/users/${pendingUserId}/approve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
    });

    if (!approveRes.ok) {
        console.error(`❌ Approval Failed: ${approveRes.status}`);
        console.error(await approveRes.text());
        process.exit(1);
    }

    const approveData = await approveRes.json();
    console.log("✅ User Approved Successfully!");
}

main();
