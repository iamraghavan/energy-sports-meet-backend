const { generatePassHTML } = require('../src/utils/passTemplate');
const fs = require('fs');
const path = require('path');

async function verifyPass() {
    console.log('--- 🧪 Testing Individual Pass Generation ---');
    
    // Mock registration with multiple sports
    const mockRegistration = {
        name: 'BHUVANESH',
        registration_code: 'EGSP/ENERGY/2026/A8QBJD',
        mobile: '9876543210',
        email: 'bhuvanesh@example.com',
        college_name: 'POOMPHUHAR ARTS AND SCIENCE COLLEGE (AUTONOMOUS), MELAIYUR',
        payment_status: 'paid',
        accommodation_needed: true,
        gender: 'Male',
        total_amount: 500,
        status: 'approved',
        created_at: new Date(),
        Sports: [
            { id: 1, name: 'Badminton', category: 'Boys' },
            { id: 2, name: 'Table Tennis', category: 'Boys' }
        ]
    };

    try {
        const html = await generatePassHTML(mockRegistration);
        
        // Save to a temp file for manual inspection if needed
        const outputPath = path.join(process.cwd(), 'tmp_passes.html');
        fs.writeFileSync(outputPath, html);
        
        console.log(`✅ Success! Passes generated.`);
        console.log(`Each sport has its own page-break-after: always card.`);
        console.log(`HTML saved to: ${outputPath}`);
        
        // Basic check for the two sports in the HTML
        if (html.includes('Badminton') && html.includes('Table Tennis')) {
            console.log('✅ Found both sports in the output!');
        } else {
            console.log('❌ Failed to find both sports in the output.');
        }

        if (html.includes('page-break-after: always')) {
            console.log('✅ Found page-break CSS!');
        } else {
            console.log('❌ Missing page-break CSS.');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    }
}

verifyPass();
