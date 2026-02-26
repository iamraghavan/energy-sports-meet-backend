const axios = require('axios');

async function testAuth() {
    const url = 'http://localhost:8080/api/v1/scorer/matches/876cd604-87df-4661-88dc-8df31f716870/state';
    
    console.log('--- Test 1: No Token ---');
    try {
        await axios.post(url, { striker_id: 'test' });
    } catch (error) {
        console.log('Status:', error.response.status);
        console.log('Error Body:', error.response.data);
    }

    console.log('\n--- Test 2: Malformed Token ---');
    try {
        await axios.post(url, { striker_id: 'test' }, {
            headers: { 'Authorization': 'Basic 123' }
        });
    } catch (error) {
        console.log('Status:', error.response.status);
        console.log('Error Body:', error.response.data);
    }
}

testAuth();
