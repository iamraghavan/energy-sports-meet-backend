const request = require('supertest');
const app = require('../app');
const { College, Student, Registration, Sport, sequelize } = require('../models');

// Mock external services
jest.mock('../utils/upload', () => ({
    uploadToGitHub: jest.fn().mockResolvedValue('mocked_screenshot_url')
}));

jest.mock('../utils/whatsapp', () => ({
    sendWhatsApp: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../utils/email', () => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../utils/googleSheets', () => ({
    appendRegistrationToSheet: jest.fn().mockResolvedValue({ success: true })
}));

jest.setTimeout(60000);

describe('Registration API Tests', () => {
    let testSport;
    let existingCollege;

    beforeAll(async () => {
        // Sync models
        await sequelize.sync({ alter: true });

        // Create a test sport
        testSport = await Sport.create({
            name: 'Test Sport',
            category: 'Men',
            type: 'Individual',
            amount: 500.00,
            status: 'active'
        });

        // Create an existing college
        existingCollege = await College.create({
            name: 'Existing Test College',
            city: 'Test City',
            state: 'Test State'
        });
    });

    afterAll(async () => {
        // Cleanup test data
        if (testSport) await testSport.destroy();
        if (existingCollege) await existingCollege.destroy();

        // Find and delete test students/registrations
        await Student.destroy({ where: { email: 'test_student@example.com' } });
        await Student.destroy({ where: { email: 'new_college_student@example.com' } });
        await Student.destroy({ where: { email: 'no_pd_student@example.com' } });
        await College.destroy({ where: { name: 'New Unique College' } });
    });

    test('Case 1: Register with an existing college', async () => {
        const res = await request(app)
            .post('/api/v1/register')
            .field('name', 'Test Student')
            .field('email', 'test_student@example.com')
            .field('mobile', '1234567890')
            .field('txn_id', 'TXN001')
            .field('college_id', existingCollege.id)
            .field('selected_sport_ids', testSport.id.toString())
            .field('accommodation_needed', 'false')
            .attach('screenshot', Buffer.from('mock_image_content'), 'screenshot.jpg');

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('success');

        const registration = await Registration.findByPk(res.body.data.registration_id);
        expect(registration.college_id).toBe(existingCollege.id);
        expect(registration.college_name).toBe(existingCollege.name);
    });

    test('Case 2: Register with a new college (automated creation)', async () => {
        const res = await request(app)
            .post('/api/v1/register')
            .field('name', 'New College Student')
            .field('email', 'new_college_student@example.com')
            .field('mobile', '0987654321')
            .field('txn_id', 'TXN002')
            .field('other_college', 'New Unique College')
            .field('city', 'New City')
            .field('state', 'New State')
            .field('selected_sport_ids', testSport.id.toString())
            .attach('screenshot', Buffer.from('mock_image_content'), 'screenshot.jpg');

        expect(res.status).toBe(201);

        // Verify college was created
        const college = await College.findOne({ where: { name: 'New Unique College' } });
        expect(college).toBeTruthy();
        expect(college.city).toBe('New City');

        const registration = await Registration.findByPk(res.body.data.registration_id);
        expect(registration.college_id).toBe(college.id);
    });

    test('Case 3: Register with missing PD details (should succeed)', async () => {
        const res = await request(app)
            .post('/api/v1/register')
            .field('name', 'No PD Student')
            .field('email', 'no_pd_student@example.com')
            .field('mobile', '5555555555')
            .field('txn_id', 'TXN003')
            .field('college_id', existingCollege.id)
            .field('selected_sport_ids', testSport.id.toString())
            .attach('screenshot', Buffer.from('mock_image_content'), 'screenshot.jpg');

        expect(res.status).toBe(201);

        const registration = await Registration.findByPk(res.body.data.registration_id);
        expect(registration.pd_name).toBeNull();
        expect(registration.pd_whatsapp).toBeNull();
    });
});
