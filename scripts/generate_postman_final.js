const fs = require('fs');
const path = require('path');

const collection = {
    info: {
        name: "energy_v1_final",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: [],
    variable: [
        { key: "BASE_URL", value: "http://localhost:8080", type: "string" },
        { key: "TOKEN", value: "", type: "string" },
        { key: "STUDENT_TOKEN", value: "", type: "string" }
    ]
};

const addRequest = (folder, name, method, urlPath, body = null, authType = 'admin', queryParams = [], description = "") => {
    const item = {
        name: name,
        request: {
            method: method,
            header: [],
            url: {
                raw: `{{BASE_URL}}${urlPath}`,
                host: ["{{BASE_URL}}"],
                path: urlPath.split('/').filter(p => p.length > 0 && !p.includes('?'))
            },
            description: description
        }
    };

    // Handle Query Params
    if (urlPath.includes('?')) {
        const queryPart = urlPath.split('?')[1];
        const params = new URLSearchParams(queryPart);
        item.request.url.query = [];
        params.forEach((value, key) => {
            item.request.url.query.push({ key: key, value: value });
        });
    }

    // Explicit Query Params from argument
    if (queryParams.length > 0) {
        if (!item.request.url.query) item.request.url.query = [];
        item.request.url.query.push(...queryParams);
    }

    // Auth Headers
    if (authType === 'admin' || authType === 'sh' || authType === 'scorer') {
         item.request.auth = {
            type: "bearer",
            bearer: [
                { key: "token", value: "{{TOKEN}}", type: "string" }
            ]
        };
    } else if (authType === 'student') {
         item.request.auth = {
            type: "bearer",
            bearer: [
                { key: "token", value: "{{STUDENT_TOKEN}}", type: "string" }
            ]
        };
    }

    // Body
    if (body) {
        item.request.header.push({ key: "Content-Type", value: "application/json" });
        item.request.body = {
            mode: "raw",
            raw: JSON.stringify(body, null, 2)
        };
    }

    folder.item.push(item);
};

const createFolder = (name) => {
    const folder = { name: name, item: [] };
    collection.item.push(folder);
    return folder;
};

// =========================================================================
// 1. AUTH ROUTES
// =========================================================================
const authFolder = createFolder("1. Auth");
addRequest(authFolder, "Login (Admin/SH/Scorer)", "POST", "/api/v1/auth/login", { email: "admin@example.com", password: "password123" }, 'none');
addRequest(authFolder, "Create User (Super Admin)", "POST", "/api/v1/auth/create-user", { name: "New User", email: "new@example.com", password: "password", role: "sports_head", assigned_sport_id: 1 }, 'admin');
addRequest(authFolder, "Get All Users (Super Admin)", "GET", "/api/v1/auth/users", null, 'admin');
addRequest(authFolder, "Update Profile", "PUT", "/api/v1/auth/profile", { name: "Updated Name" }, 'admin');
addRequest(authFolder, "Delete User", "DELETE", "/api/v1/auth/users/1", null, 'admin');

// =========================================================================
// 2. STUDENT AUTH ROUTES
// =========================================================================
const studentAuthFolder = createFolder("2. Student Auth");
addRequest(studentAuthFolder, "Request OTP", "POST", "/api/v1/auth/student/request-otp", { identifier: "student@example.com" }, 'none');
addRequest(studentAuthFolder, "Verify OTP", "POST", "/api/v1/auth/student/verify-otp", { identifier: "student@example.com", otp: "123456" }, 'none');

// =========================================================================
// 3. COLLEGES ROUTES
// =========================================================================
const collegeFolder = createFolder("3. Colleges");
addRequest(collegeFolder, "Get All Colleges", "GET", "/api/v1/colleges", null, 'none');
addRequest(collegeFolder, "Create College", "POST", "/api/v1/colleges", { name: "New College", city: "Salem", state: "Tamil Nadu" }, 'none');
addRequest(collegeFolder, "Bulk Create Colleges", "POST", "/api/v1/colleges/bulk", { colleges: [{ name: "A", city: "X" }, { name: "B", city: "Y" }] }, 'none');

// =========================================================================
// 4. SPORTS ROUTES
// =========================================================================
const sportFolder = createFolder("4. Sports");
addRequest(sportFolder, "Get All Sports", "GET", "/api/v1/sports", null, 'none');
addRequest(sportFolder, "Create Sport", "POST", "/api/v1/sports", { name: "Cricket", category: "Men", type: "Team", amount: 1000 }, 'none');

// =========================================================================
// 5. REGISTRATION ROUTES
// =========================================================================
const regFolder = createFolder("5. Registration");
addRequest(regFolder, "Register Student", "POST", "/api/v1/register", { name: "Student", email: "s@test.com", mobile: "9999999999", college_id: 1, sport_ids: [1], transaction_id: "TXN123" }, 'none', [], "Requires form-data usually for Screenshot");
addRequest(regFolder, "View Registrations (Admin/SH)", "GET", "/api/v1/register", null, 'admin');
addRequest(regFolder, "Get Registration Details", "GET", "/api/v1/register/details?id=REG-123", null, 'none');
addRequest(regFolder, "Download Ticket", "GET", "/api/v1/register/ticket?id=REG-123", null, 'none');
addRequest(regFolder, "Download Check-in", "GET", "/api/v1/register/checkin?id=REG-123", null, 'none');

// =========================================================================
// 6. STUDENT DASHBOARD ROUTES
// =========================================================================
const dashboardFolder = createFolder("6. Student Dashboard");
addRequest(dashboardFolder, "Dashboard Stats", "GET", "/api/v1/dashboard", null, 'student', [{ key: "sport_id", value: "1", description: "Optional filter" }]);
// Team Management
addRequest(dashboardFolder, "Get Team By ID", "GET", "/api/v1/dashboard/teams/1", null, 'student');
addRequest(dashboardFolder, "Create Team", "POST", "/api/v1/dashboard/teams", { team_name: "My Team", sport_id: 1 }, 'student');
addRequest(dashboardFolder, "Update Team", "PUT", "/api/v1/dashboard/teams/1", { team_name: "Updated Team" }, 'student');
addRequest(dashboardFolder, "Delete Team", "DELETE", "/api/v1/dashboard/teams/1", null, 'student');
addRequest(dashboardFolder, "Add Team Member", "POST", "/api/v1/dashboard/teams/1/members", { name: "Member", mobile: "8888888888" }, 'student');
addRequest(dashboardFolder, "Bulk Add Members", "POST", "/api/v1/dashboard/teams/1/members/bulk", { members: [{ name: "A", mobile: "1" }, { name: "B", mobile: "2" }] }, 'student');
// Member Management
addRequest(dashboardFolder, "Get Member Details", "GET", "/api/v1/dashboard/members/1", null, 'student');
addRequest(dashboardFolder, "Update Member", "PUT", "/api/v1/dashboard/members/1", { role: "Captain" }, 'student');
addRequest(dashboardFolder, "Patch Member", "PATCH", "/api/v1/dashboard/members/1", { status: "active" }, 'student');
addRequest(dashboardFolder, "Delete Member", "DELETE", "/api/v1/dashboard/members/1", null, 'student');
addRequest(dashboardFolder, "Bulk Update Members", "PUT", "/api/v1/dashboard/members/bulk", { updates: [{ id: 1, name: "New A" }] }, 'student');
addRequest(dashboardFolder, "Bulk Delete Members", "DELETE", "/api/v1/dashboard/members/bulk", { ids: [1, 2] }, 'student');

// =========================================================================
// 7. ADMIN ROUTES
// =========================================================================
const adminFolder = createFolder("7. Admin");
addRequest(adminFolder, "Get Users", "GET", "/api/v1/admin/users", null, 'admin');
addRequest(adminFolder, "Create User", "POST", "/api/v1/admin/users", { name: "User", email: "u@t.com", role: "admin" }, 'admin');
addRequest(adminFolder, "Update User", "PUT", "/api/v1/admin/users/1", { name: "Updated" }, 'admin');
addRequest(adminFolder, "Delete User", "DELETE", "/api/v1/admin/users/1", null, 'admin');
addRequest(adminFolder, "Get Registrations", "GET", "/api/v1/admin/registrations", null, 'admin');
addRequest(adminFolder, "Verify Payment", "POST", "/api/v1/admin/verify-payment", { registration_id: 1, status: "paid" }, 'admin');
addRequest(adminFolder, "Get Payments", "GET", "/api/v1/admin/payments", null, 'admin');
addRequest(adminFolder, "Get Payment Details", "GET", "/api/v1/admin/payments/1", null, 'admin');
addRequest(adminFolder, "Request Payment Proof", "POST", "/api/v1/admin/payments/1/request-proof", { reason: "Blurry" }, 'admin');
addRequest(adminFolder, "Get Analytics", "GET", "/api/v1/admin/analytics", null, 'admin');
addRequest(adminFolder, "Match Reports", "GET", "/api/v1/admin/reports/matches", null, 'admin');

// =========================================================================
// 8. COMMITTEE ROUTES
// =========================================================================
const committeeFolder = createFolder("8. Committee");
addRequest(committeeFolder, "Get Registrations", "GET", "/api/v1/committee/registrations", null, 'admin');
addRequest(committeeFolder, "Update Check-in", "PATCH", "/api/v1/committee/checkin/1", { checked_in: true }, 'admin');
addRequest(committeeFolder, "Generate Pass", "GET", "/api/v1/committee/registrations/1/print-pass", null, 'admin');
addRequest(committeeFolder, "Get Student Details", "GET", "/api/v1/committee/student/1", null, 'admin');

// =========================================================================
// 9. MATCH ROUTES
// =========================================================================
const matchFolder = createFolder("9. Matches");
addRequest(matchFolder, "Live Matches (Public)", "GET", "/api/v1/matches/live", null, 'none');
addRequest(matchFolder, "Matches By Sport (Public)", "GET", "/api/v1/matches/sport/1", null, 'none');
addRequest(matchFolder, "Match Details (Public)", "GET", "/api/v1/matches/1", null, 'none');
addRequest(matchFolder, "Create Match", "POST", "/api/v1/matches", { sport_id: 1, team_a_id: 1, team_b_id: 2, start_time: "2024-01-01T10:00:00Z" }, 'admin');
addRequest(matchFolder, "Update Match", "PUT", "/api/v1/matches/1", { status: "live" }, 'admin');
addRequest(matchFolder, "Delete Match", "DELETE", "/api/v1/matches/1", null, 'admin');
addRequest(matchFolder, "Update Score", "PUT", "/api/v1/matches/1/score", { score_a: 10, score_b: 5 }, 'admin');
addRequest(matchFolder, "Get Lineup", "GET", "/api/v1/matches/1/lineup", null, 'none');
addRequest(matchFolder, "Update Lineup", "POST", "/api/v1/matches/1/lineup", { team_id: 1, players: [1, 2] }, 'admin');
addRequest(matchFolder, "Match Event", "POST", "/api/v1/matches/1/event", { event: "Goal", player_id: 1 }, 'admin');

// =========================================================================
// 10. SPORTS HEAD ROUTES
// =========================================================================
const shFolder = createFolder("10. Sports Head");
addRequest(shFolder, "Get Stats", "GET", "/api/v1/sports-head/stats", null, 'sh');
addRequest(shFolder, "Get Analytics", "GET", "/api/v1/sports-head/analytics", null, 'sh');
addRequest(shFolder, "Get Matches", "GET", "/api/v1/sports-head/matches", null, 'sh');
addRequest(shFolder, "Schedule Match", "POST", "/api/v1/sports-head/matches/schedule", { team_a: 1, team_b: 2, time: "10:00" }, 'sh');
addRequest(shFolder, "Update Match", "PATCH", "/api/v1/sports-head/matches/1", { status: "completed" }, 'sh');
addRequest(shFolder, "Get Teams", "GET", "/api/v1/sports-head/teams", null, 'sh');
addRequest(shFolder, "Create Team", "POST", "/api/v1/sports-head/teams", { team_name: "SH Team", registration_id: 1 }, 'sh');
addRequest(shFolder, "Get Team Details", "GET", "/api/v1/sports-head/teams/1", null, 'sh');
addRequest(shFolder, "Update Team", "PUT", "/api/v1/sports-head/teams/1", { team_name: "Updated SH Team" }, 'sh');
addRequest(shFolder, "Delete Team", "DELETE", "/api/v1/sports-head/teams/1", null, 'sh');
addRequest(shFolder, "Get Students", "GET", "/api/v1/sports-head/students", null, 'sh');
addRequest(shFolder, "Bulk Add Players", "POST", "/api/v1/sports-head/teams/1/players/bulk", { registration_ids: [1, 2] }, 'sh');
addRequest(shFolder, "Add Player", "POST", "/api/v1/sports-head/teams/1/players/1", null, 'sh');
addRequest(shFolder, "Update Player", "PUT", "/api/v1/sports-head/teams/1/players/1", { role: "Captain" }, 'sh');
addRequest(shFolder, "Remove Player", "DELETE", "/api/v1/sports-head/teams/1/players/1", null, 'sh');
addRequest(shFolder, "Get Registrations", "GET", "/api/v1/sports-head/registrations", null, 'sh');


// =========================================================================
// 11. SCORER ROUTES
// =========================================================================
const scorerFolder = createFolder("11. Scorer");
addRequest(scorerFolder, "Start Match", "POST", "/api/v1/scorer/matches/1/start", null, 'scorer');
addRequest(scorerFolder, "Update Score", "PATCH", "/api/v1/scorer/matches/1/score", { team_a_score: 1 }, 'scorer');
addRequest(scorerFolder, "Match Event", "POST", "/api/v1/scorer/matches/1/event", { event: "Six" }, 'scorer');
addRequest(scorerFolder, "End Match", "POST", "/api/v1/scorer/matches/1/end", null, 'scorer');

// =========================================================================
// 12. TEAM ROUTES (Public/Shared)
// =========================================================================
const teamFolder = createFolder("12. Teams (Public)");
addRequest(teamFolder, "Get All Teams", "GET", "/api/v1/teams", null, 'none');
addRequest(teamFolder, "Get Teams By Sport", "GET", "/api/v1/teams/sport/1", null, 'none');
addRequest(teamFolder, "Get Team By ID", "GET", "/api/v1/teams/1", null, 'none');
addRequest(teamFolder, "Create Team (Protected)", "POST", "/api/v1/teams", { name: "Team A" }, 'admin');
addRequest(teamFolder, "Update Team (Protected)", "PUT", "/api/v1/teams/1", { name: "Team B" }, 'admin');
addRequest(teamFolder, "Delete Team (Protected)", "DELETE", "/api/v1/teams/1", null, 'admin');

// =========================================================================
// 13. OVERVIEW
// =========================================================================
addRequest(createFolder("13. Overview"), "Overview Stats", "GET", "/api/v1/overview/stats", null, 'admin');

// WRITE FILE
const outputPath = path.resolve('C:\\Users\\Raghavan Jeeva\\.gemini\\antigravity\\brain\\c700b3d9-7929-4011-b039-38dabed15e84', 'energy_v1_final.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
console.log(`Postman collection generated at: ${outputPath}`);
