const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

async function testLiveRegistration() {
    console.log('🚀 Starting Live Registration Test (Render URL)...');

    const url = 'https://energy-sports-meet-backend.onrender.com/api/v1/register';

    // Create form data using user-provided details
    const form = new FormData();
    form.append('name', 'Raghavan Jeeva');
    form.append('email', 'raghavanofficials@gmail.com');
    form.append('mobile', '6382087377');
    form.append('whatsapp', '916382087377'); // Added 91 prefix
    form.append('city', 'Nagapattinam');
    form.append('state', 'Tamil Nadu');
    form.append('other_college', 'EGS Pillay Engineering College');
    form.append('selected_sport_ids', '6'); // Kabaddi
    form.append('create_team', 'true');
    form.append('team_name', 'EGS Raiders');
    form.append('pd_name', 'Raghavan Jeeva');
    form.append('pd_whatsapp', '916382087377'); // Added 91 prefix
    form.append('college_email', 'web@egspec.org');
    form.append('college_contact', '6382087377');
    form.append('accommodation_needed', 'false');
    form.append('txn_id', `TXN_RENDER_TEST_${Date.now()}`);

    // Use a dummy screenshot from node_modules
    const screenshotPath = path.join(__dirname, '../node_modules/png-js/images/ball.png');
    if (fs.existsSync(screenshotPath)) {
        form.append('screenshot', fs.createReadStream(screenshotPath));
    } else {
        console.warn('⚠️ Dummy screenshot not found, skipping file attachment.');
    }

    try {
        console.log(`Sending POST request to: ${url}...`);
        const response = await axios.post(url, form, {
            headers: {
                ...form.getHeaders()
            }
        });

        console.log('✅ Status Code:', response.status);
        console.log('✅ Response:', response.data);
    } catch (error) {
        console.error('❌ Request Failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error Data:', error.response.data);
        } else {
            console.error('Message:', error.message);
        }
    }

    console.log('✨ Live test finished.');
}

testLiveRegistration();
