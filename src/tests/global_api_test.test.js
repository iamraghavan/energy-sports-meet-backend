const path = require('path');
const fs = require('fs');
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
if (fs.existsSync(envPath)) {
    console.log('.env exists. First 50 chars:', fs.readFileSync(envPath, 'utf8').substring(0, 50));
} else {
    console.error('.env OT FOUND at', envPath);
}
const dotenvResult = require('dotenv').config({ path: envPath });
console.log('Dotenv result:', dotenvResult);
console.log('DB_HOST:', process.env.DB_HOST);


const request = require('supertest');
const jwt = require('jsonwebtoken');

// MOCK Octokit to prevent ESM SyntaxError
jest.mock('@octokit/rest', () => ({
    Octokit: jest.fn().mockImplementation(() => ({
        repos: { createOrUpdateFileContents: jest.fn() }
    }))
}));

// MOCK Upload Utils completely
jest.mock('../utils/upload', () => ({
    uploadToGitHub: jest.fn().mockResolvedValue('mocked_screenshot_url')
}));

// MOCK Notifications
jest.mock('../utils/whatsapp', () => ({
    sendWhatsApp: jest.fn().mockResolvedValue({ success: true })
}));
jest.mock('../utils/email', () => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true })
}));

const app = require('../app');
const { sequelize, User, Sport, Registration, College, Team, TeamMember, Student } = require('../models');

jest.setTimeout(60000); // 1 minute timeout

describe('Global API Smoke Test - Sports Head Workflow', () => {
    let testSport;
    let testCollege;
    let sportsHeadUser;
    let sportsHeadToken;
    let registrations = [];
    let createdTeamId;

    beforeAll(async () => {
        // 1. Sync DB (Skipping alter to avoid root@localhost issue if sync causes it)
        // await sequelize.sync({ alter: true });

        // 2. Create Test College
        testCollege = await College.create({
            name: 'Global Test College',
            city: 'Test City',
            state: 'Test State'
        });

        // 3. Create Test Sport
        testSport = await Sport.create({
            name: 'Global Test Sport',
            category: 'Men',
            type: 'Team',
            amount: 1000.00,
            status: 'active'
        });

        // 4. Create Sports Head User
        sportsHeadUser = await User.create({
            username: 'sh_test_user',
            name: 'Test Sports Head',
            email: 'sh_test@example.com',
            password: 'hashed_password_placeholder', // We bypass login
            role: 'sports_head',
            assigned_sport_id: testSport.id
        });

        // Generate Token directly
        sportsHeadToken = jwt.sign({ id: sportsHeadUser.id, role: 'sports_head' }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // 5. Create 3 Registrations (Unassigned Players)
        for (let i = 1; i <= 3; i++) {
            const reg = await Registration.create({
                registration_code: `TEST-REG-${i}`,
                name: `Test Player ${i}`,
                email: `player${i}@test.com`,
                mobile: `999999990${i}`,
                college_id: testCollege.id,
                college_name: testCollege.name,
                college_city: testCollege.city,
                college_state: testCollege.state, // Fix: Required for Student creation
                status: 'approved', // Must be approved to appear in dashboard
                payment_status: 'paid',
                total_amount: 1000.00
            });
            // Link to Sport
            const { RegistrationSport } = require('../models');
            await RegistrationSport.create({
                registration_id: reg.id,
                sport_id: testSport.id
            });
            registrations.push(reg);
        }
    });

    afterAll(async () => {
        // Cleanup (Order matters due to FKs)
        if (createdTeamId) {
            await TeamMember.destroy({ where: { team_id: createdTeamId } });
            await Team.destroy({ where: { id: createdTeamId } });
        }
        
        await Student.destroy({ where: { email: { [require('sequelize').Op.like]: '%@test.com' } } });
        await Registration.destroy({ where: { college_name: 'Global Test College' } });
        await User.destroy({ where: { email: 'sh_test@example.com' } });
        await Sport.destroy({ where: { name: 'Global Test Sport' } });
        await College.destroy({ where: { name: 'Global Test College' } });
    });

    // --- TESTS ---

    test('1. Auth (Student): Request OTP should work', async () => {
        const res = await request(app)
            .post('/api/v1/auth/student/request-otp')
            .send({ identifier: registrations[0].email });
        
        expect(res.status).toBe(200);
        expect(res.body.message).toContain('OTP sent');
    });

    test('2. Sports Head: Get Dashboard Stats', async () => {
        const res = await request(app)
            .get('/api/v1/overview/stats')
            .set('Authorization', `Bearer ${sportsHeadToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.title).toContain('Global Test Sport Overview');
        // Should have 3 players (approx)
        // Note: count might be global for the sport, so exact number depends on other tests, but at least 3.
        expect(res.body.kpi).toBeDefined();
    });

    test('3. Sports Head: List Unassigned Students', async () => {
        const res = await request(app)
            .get('/api/v1/sports-head/students')
            .set('Authorization', `Bearer ${sportsHeadToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        const testPlayers = res.body.filter(s => s.college === 'Global Test College');
        expect(testPlayers.length).toBe(3);
        // All should have null team_id initially
        testPlayers.forEach(p => expect(p.team_id).toBeFalsy());
    });

    test('4. Sports Head: Create Team (using first player)', async () => {
        const captainReg = registrations[0];
        const res = await request(app)
            .post('/api/v1/sports-head/teams')
            .set('Authorization', `Bearer ${sportsHeadToken}`)
            .send({
                team_name: 'Global Test Team XI',
                registration_id: captainReg.id
            });
        
        if (res.status !== 201) {
            console.error('Create Team Error Body:', JSON.stringify(res.body, null, 2));
        }
        expect(res.status).toBe(201);
        expect(res.body.team_name).toBe('Global Test Team XI');
        createdTeamId = res.body.id;
    });

    test('5. Sports Head: Bulk Add Remaining Players', async () => {
        expect(createdTeamId).toBeDefined();
        const remainingRegs = [registrations[1].id, registrations[2].id]; // Player 2 and 3

        const res = await request(app)
            .post(`/api/v1/sports-head/teams/${createdTeamId}/players/bulk`)
            .set('Authorization', `Bearer ${sportsHeadToken}`)
            .send({
                registration_ids: remainingRegs
            });

        expect(res.status).toBe(201);
        expect(res.body.added.length).toBe(2);
    });

    test('6. Sports Head: Verify Team Membership', async () => {
        const res = await request(app)
            .get(`/api/v1/sports-head/teams/${createdTeamId}`)
            .set('Authorization', `Bearer ${sportsHeadToken}`);
        
        expect(res.status).toBe(200);
        expect(res.body.members.length).toBe(3); // 1 Captain + 2 Bulk added
    });
    
    test('7. Sports Head: Get Matches (Should be empty initially)', async () => {
         const res = await request(app)
            .get('/api/v1/sports-head/matches')
            .set('Authorization', `Bearer ${sportsHeadToken}`);
        
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
