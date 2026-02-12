const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();

async function testLocalRegistration() {
    const port = process.env.PORT || 5000;
    console.log(`🚀 Starting Local Registration Test (http://localhost:${port})...`);

    const url = `http://localhost:${port}/api/v1/register`;

    const form = new FormData();
    form.append('name', 'Local Tester');
    form.append('email', `local_${Date.now()}@example.com`);
    form.append('mobile', '9999999999');
    form.append('city', 'Local City');
    form.append('state', 'Local State');
    form.append('other_college', 'Local University');
    form.append('selected_sport_ids', '1,2'); // Dummy IDs
    form.append('txn_id', `TXN_LOCAL_${Date.now()}`);

    const screenshotPath = path.join(__dirname, '../node_modules/png-js/images/ball.png');
    if (fs.existsSync(screenshotPath)) {
        form.append('screenshot', fs.createReadStream(screenshotPath));
    }

    try {
        const response = await axios.post(url, form, {
            headers: form.getHeaders()
        });
        console.log('✅ Response:', response.data);
    } catch (error) {
        console.error('❌ Request Failed:', error.response ? error.response.data : error.message);
    }
}

testLocalRegistration();
