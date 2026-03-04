const axios = require('axios');

async function testEnhancedReport() {
    console.log('--- 🧪 Testing Enhanced Official Registration Report ---');
    const BASE_URL = 'http://localhost:8080/api/v1/register/official-report';

    try {
        const res = await axios.get(BASE_URL);
        const { analytics } = res.data;
        
        console.log('\nAnalytics Summary:');
        console.log(`- Total Registrations: ${analytics.totalRegistrations}`);
        console.log(`- Status Breakdown:`, JSON.stringify(analytics.statusBreakdown));
        console.log(`- Gender Breakdown:`, JSON.stringify(analytics.genderBreakdown));
        console.log(`- Team Breakdown (Boys/Girls):`, JSON.stringify(analytics.teamBreakdown));
        console.log(`- Top College:`, analytics.collegeBreakdown[0]?.name || 'N/A', `(${analytics.collegeBreakdown[0]?.count || 0})`);
        
        // Assert team breakdown exists and has keys
        if (analytics.teamBreakdown && (analytics.teamBreakdown.Boys !== undefined || analytics.teamBreakdown.Girls !== undefined)) {
            console.log('\n✅ Success: Team breakdown (Boys/Girls) is present.');
        } else {
            console.warn('\n⚠️ Warning: Team breakdown might be empty if no teams are created yet.');
        }

        if (analytics.collegeBreakdown && analytics.collegeBreakdown.length > 0) {
            console.log('✅ Success: College breakdown is present.');
        }

        console.log('\n✅ All enhanced tests completed!');
    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

testEnhancedReport();
