const { sendWhatsApp } = require('./src/utils/whatsapp');

async function runTest() {
    console.log('🚀 Running Confirmed WhatsApp Test (Postman Sample)...');

    const testData = {
        phone: '916382087377',
        template_name: 'energy_sports_meet_2026_registration_received',
        variables: [
            'Raghavan',                   // text1 -> {{name}}
            'Kabaddi',                    // text2 -> {{sportsname}}
            'EGSP/ENERGY/2026/TEST',      // text3 -> {{regcode}}
            'Pending'                     // text4 -> {{status}}
        ],
        buttons: [
            'EGSP/ENERGY/2026/K8GBH4P8',  // buttonURL1 -> maps to View Registration (?id={{1}})
            'EGSP/ENERGY/2026/K8GBH4P8'   // buttonURL2 -> Now testing Download Ticket using Reg Code (?id={{1}})
        ]
    };

    console.log('Sending working payload to TryowBot...');
    const result = await sendWhatsApp(testData);

    console.log('\n--- API Response ---');
    console.log(JSON.stringify(result, null, 2));

    if (result && result.status === 'success') {
        console.log('\n✅ SUCCESS: Message accepted by TryowBot and sent to Meta.');
    } else {
        console.log('\n❌ FAILED.');
    }
}

runTest();
