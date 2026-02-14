const nodemailer = require('nodemailer');
require('dotenv').config();

async function verifySMTP() {
    console.log('--- SMTP Connectivity Test ---');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 587,
        secure: false, // STARTTLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        }
    });

    try {
        console.log('Attempting to connect and authenticate...');
        const success = await transporter.verify();
        if (success) {
            console.log('\n✅ COMPLETED: The Email Server (SES) is WORKING!');
            console.log('✅ Credentials are valid and connection is established.');
            console.log('\nNOTE: If you still cannot receive emails, it is because you must');
            console.log('VERIFY your sender identity (noreply@egsppc.ac.in) in the AWS Console.');
        }
    } catch (error) {
        console.error('\n❌ FAILED: Connection or Authentication Error');
        console.error(error.message);
    }
}

verifySMTP();
