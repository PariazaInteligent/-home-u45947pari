// Clearance Tests 2-4: Direct API Testing
// Run with: node test_clearance.js

const fs = require('fs');

const API_URL = 'http://localhost:3001';
let token = '';
let userId = '';

async function login() {
    console.log('\n=== LOGIN ===');
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@pariazainteligent.ro',
            password: 'password123'
        })
    });
    const data = await res.json();
    token = data.accessToken;
    console.log('✅ Logged in, token:', token.substring(0, 20) + '...');
    return data;
}

async function test2CheckIn() {
    console.log('\n=== TEST 2: CHECK-IN TRIGGER ===');
    const res = await fetch(`${API_URL}/api/users/profile/checkin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
}

async function test3MeEnrichment() {
    console.log('\n=== TEST 3: /ME ENRICHMENT ===');
    const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    userId = data.user.id;
    console.log('User ID:', userId);
    console.log('Clearance Object:', JSON.stringify(data.clearance, null, 2));
    return data;
}

async function test4aUpdateConfig() {
    console.log('\n=== TEST 4a: PATCH CONFIG (LOWER LEVEL 2) ===');
    const res = await fetch(`${API_URL}/admin/clearance/config/2`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requiredStreak: 1, requiredLoyalty: 10 })
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
}

async function test4bRecalculate() {
    console.log('\n=== TEST 4b: FORCE RECALCULATE ===');
    const res = await fetch(`${API_URL}/admin/users/${userId}/clearance/recalculate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    return data;
}

async function test4cVerifyChange() {
    console.log('\n=== TEST 4c: VERIFY LEVEL CHANGE ===');
    const res = await fetch(`${API_URL}/api/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('New Clearance Level:', data.clearance.level, data.clearance.levelName);
    console.log('Full Clearance:', JSON.stringify(data.clearance, null, 2));
    return data;
}

async function runAll() {
    try {
        const results = {
            login: await login(),
            test2: await test2CheckIn(),
            test3: await test3MeEnrichment(),
            test4a: await test4aUpdateConfig(),
            test4b: await test4bRecalculate(),
            test4c: await test4cVerifyChange()
        };

        // Save results
        fs.writeFileSync('_ai/test_results.json', JSON.stringify(results, null, 2));
        console.log('\n✅ ALL TESTS COMPLETE! Results saved to _ai/test_results.json');

        return results;
    } catch (err) {
        console.error('❌ Error:', err.message);
        throw err;
    }
}

runAll();
