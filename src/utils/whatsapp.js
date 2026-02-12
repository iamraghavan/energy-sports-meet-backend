const axios = require('axios');
require('dotenv').config();

/**
 * Send WhatsApp message using TryowBot API
 * @param {Object} options - { phone, template_name, variables, buttons }
 */
exports.sendWhatsApp = async ({ phone, template_name, variables = [], buttons = [] }) => {
    try {
        const payload = {
            token: process.env.WHATSAPP_TOKEN,
            phone: phone.startsWith('91') ? phone : `91${phone}`, // Ensure 91 prefix for India
            template_name: template_name,
            template_language: 'en'
        };

        // Add variables (text1, text2, ...)
        variables.forEach((val, index) => {
            payload[`text${index + 1}`] = val;
        });

        // Add dynamic button URLs (buttonURL1, buttonURL2, ...)
        buttons.forEach((val, index) => {
            payload[`buttonURL${index + 1}`] = val;
        });

        console.log('--- Sending WhatsApp ---');
        console.log('URL:', process.env.WHATSAPP_API_URL);
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post(process.env.WHATSAPP_API_URL, payload);

        console.log('WhatsApp Status:', response.data);
        return response.data;
    } catch (error) {
        console.error('WhatsApp Error:', error.response?.data || error.message);
        // We typically don't fail the main request if notification fails
        return null;
    }
};
