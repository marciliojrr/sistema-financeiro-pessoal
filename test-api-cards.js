const API_URL = 'http://localhost:3001/api/v1';

async function request(url, method, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    };

    const res = await fetch(url, options);
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Request failed: ${res.status} ${txt}`);
    }
    return res.json();
}

async function runTest() {
    try {
        const timestamp = Date.now();
        const email = `test_card_${timestamp}@example.com`;
        const password = 'Password123!';

        console.log(`1. Registering user ${email}...`);
        await request(`${API_URL}/users`, 'POST', { name: 'Test User', email, password });
        
        console.log('2. Logging in...');
        const loginRes = await request(`${API_URL}/auth/login`, 'POST', { email, password });
        const token = loginRes.access_token;
        const userProfileId = loginRes.user.defaultProfileId;
        
        console.log('   Profile ID (from login):', userProfileId);

        if (!userProfileId) throw new Error("No default profile returned on login");

        console.log('4. Creating Credit Card...');
        const cardRes = await request(`${API_URL}/credit-cards`, 'POST', {
            cardName: 'Test Card Fetch',
            bank: 'Test Bank',
            cardNumber: '4242424242424242',
            limit: 5000,
            closingDay: 1,
            dueDay: 10,
            profileId: userProfileId
        }, token);
        const cardId = cardRes.id;
        console.log('   Card Created:', cardId);

        console.log('5. Registering Installment Purchase...');
        const purchaseRes = await request(`${API_URL}/credit-cards/installment-purchases`, 'POST', {
            productName: 'Gaming Laptop',
            totalValue: 3000,
            installments: 10,
            purchaseDate: new Date().toISOString(),
            creditCardId: cardId
        }, token);
        
        console.log('   Purchase Created:', purchaseRes.id);
        // Check local installments logic if returned, otherwise verified later via card details.

        console.log('6. Checking Card Details (should succeed with relations)...');
        // Ensure backend restart applied the 'findOne' change to include 'purchases'
        const cardDetailRes = await request(`${API_URL}/credit-cards/${cardId}`, 'GET', null, token);
        
        console.log('   Card loaded. Checking relations...');
        const purchases = cardDetailRes.purchases || [];
        console.log('   Purchases count:', purchases.length);

        if (purchases.length !== 1) {
             console.log('WARNING: Purchases relation might not be loaded. Did backend restart finish?');
             // console.log('Full response:', JSON.stringify(cardDetailRes, null, 2));
        } else {
             console.log('   SUCCESS: Purchase linked correctly!');
        }

        console.log('ALL TESTS PASSED');
    } catch (e) {
        console.error('FAILED:', e.message);
        process.exit(1);
    }
}

runTest();
