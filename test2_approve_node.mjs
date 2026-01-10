const doFetch = fetch;

async function main() {
    const adminEmail = "admin@pariazainteligent.ro";
    const adminPass = "password123";
    const pendingUserId = "cmjmxo3eo0007ppgdci1rnud2";

    console.log(`🔹 1. Logging in as ${adminEmail}...`);

    try {
        const loginRes = await doFetch("http://localhost:3001/auth/login", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: adminPass })
        });

        if (!loginRes.ok) {
            console.error(`❌ Login Failed: ${loginRes.status} ${loginRes.statusText}`);
            console.error(await loginRes.text());
            process.exit(1);
        }

        const loginData = await loginRes.json();
        const token = loginData.accessToken;

        if (!token) {
            console.error('❌ Token missing in response:', loginData);
            process.exit(1);
        }

        console.log(`✅ Login OK. Token: ${token.substring(0, 15)}...`);

        console.log(`🔹 2. Approving user ${pendingUserId}...`);

        const approveRes = await doFetch(`http://localhost:3001/admin/users/${pendingUserId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
        });

        if (!approveRes.ok) {
            console.error(`❌ Approval Failed: ${approveRes.status} ${approveRes.statusText}`);
            console.error(await approveRes.text());
            process.exit(1);
        }

        const approveData = await approveRes.json();
        console.log("✅ User Approved Successfully!");
        console.log(JSON.stringify(approveData, null, 2));

    } catch (e) {
        console.error("❌ Exception:", e);
        process.exit(1);
    }
}

main();
