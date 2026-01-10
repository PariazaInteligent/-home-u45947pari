
const doFetch = fetch;

async function main() {
    const token = "1f5ea86b868d63275e6faa20d161dfe35e5dcec6e56cce710c22df91b8ff4966";
    const newPassword = "3DSecurity31";

    console.log(`🔹 Setting password for token...`);

    const res = await doFetch("http://localhost:3001/auth/set-password", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
    });

    if (!res.ok) {
        console.error(`❌ Failed: ${res.status}`);
        console.error(await res.text());
        process.exit(1);
    }

    const data = await res.json();
    console.log("✅ Password Set Successfully!");
    console.log(data);
}

main();
