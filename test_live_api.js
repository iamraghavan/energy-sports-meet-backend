const axios = require('axios');

async function triggerLiveOTP() {
    const url = 'https://energy-sports-meet-backend.onrender.com/api/v1/auth/student/request-otp';
    const payload = { identifier: 'raghavanofficials@gmail.com' };

    console.log(`Calling live API: ${url}`);
    try {
        const response = await axios.post(url, payload);
        console.log('✅ Response:', response.data);
    } catch (error) {
        console.error('❌ Error calling live API:', error.response ? error.response.data : error.message);
    }
}

triggerLiveOTP();
