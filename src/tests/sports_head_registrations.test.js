const request = require('supertest');

// --- MOCKS START ---
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
// --- MOCKS END ---

const app = require('../app');
const { sequelize, User, Sport, Registration, Team, RegistrationSport } = require('../models');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Mock Auth Middleware
jest.mock('../middlewares/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 999, role: 'sports_head', assigned_sport_id: 1 }; // Mock Sports Head for Sport ID 1
        next();
    },
    authorize: (...roles) => (req, res, next) => next(),
    protectStudent: (req, res, next) => next()
}));

describe('Sports Head Registration Enhancement', () => {
    let sportId = 1;
    let regWithTeamId, regWithoutTeamId;

    beforeAll(async () => {
        // Sync DB (force: false to keep data, but we need specific test data)
        // We'll create fresh data to be sure.
        // Assuming Sport 1 exists or we create it.
        const [sport] = await Sport.findOrCreate({
            where: { id: 1 },
            defaults: { name: 'Cricket Test', category: 'Men', type: 'Team', amount: 100 }
        });
        sportId = sport.id;

        // 1. Create Registration WITHOUT Team
        const reg1 = await Registration.create({
            id: uuidv4(),
            name: 'Player No Team',
            email: `p1_${Date.now()}@test.com`,
            mobile: '1111111111',
            registration_code: `REG-NO-TEAM-${Date.now()}`,
            college_name: 'Test College',
            college_city: 'Test City',
            status: 'approved', // Must be approved for getRegistrations
            total_amount: 100
        });
        await RegistrationSport.create({ registration_id: reg1.id, sport_id: sportId });
        regWithoutTeamId = reg1.id;

        // 2. Create Registration WITH Team
        const reg2 = await Registration.create({
            id: uuidv4(),
            name: 'Player With Team',
            email: `p2_${Date.now()}@test.com`,
            mobile: '2222222222',
            registration_code: `REG-WITH-TEAM-${Date.now()}`,
            college_name: 'Test College',
            college_city: 'Test City',
            status: 'approved',
            total_amount: 100
        });
        await RegistrationSport.create({ registration_id: reg2.id, sport_id: sportId });
        regWithTeamId = reg2.id;

        // Create Team for Reg 2
        await Team.create({
            team_name: 'The Winners',
            sport_id: sportId,
            registration_id: reg2.id,
            college_id: 1, // specific college ID usually
            locked: false
        });
    });

    afterAll(async () => {
        // Cleanup if needed, or let global cleanup handle it
    });

    test('GET /registrations should return team_created status', async () => {
        const res = await request(app)
            .get('/api/v1/sports-head/registrations');

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);

        // Find our test registrations
        const noTeamReg = res.body.find(r => r.id === regWithoutTeamId);
        const withTeamReg = res.body.find(r => r.id === regWithTeamId);

        expect(noTeamReg).toBeDefined();
        expect(noTeamReg.team_created).toBe(false);
        expect(noTeamReg.team_info).toBeNull();
        expect(noTeamReg.Teams).toBeDefined(); // The raw association

        expect(withTeamReg).toBeDefined();
        expect(withTeamReg.team_created).toBe(true);
        expect(withTeamReg.team_info).not.toBeNull();
        expect(withTeamReg.team_info.name).toBe('The Winners');
    });
});
