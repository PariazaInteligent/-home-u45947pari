
const doFetch = fetch;

async function main() {
    const payload = {
        email: "tomizeimihaita@gmail.com",
        name: "Tomizei Mihaita"
    };

    console.log("Registering...", payload);
    const res = await doFetch("http://localhost:3001/auth/register", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        console.error("Failed:", await res.text());
        process.exit(1);
    }

    const data = await res.json();
    console.log("✅ Registered:", data);
    console.log("ID:", data.id || data.user?.id);

    // Save ID to file for next steps
    const fs = await import('fs');
    fs.writeFileSync('current_user_id.txt', data.id || data.user?.id);
}

main();
