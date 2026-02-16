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

const addRequest = (folderByUser, name, method, urlPath, body = null, auth = true, userType = 'admin') => {
    const item = {
        name: name,
        request: {
            method: method,
            header: [],
            url: {
                raw: `{{BASE_URL}}${urlPath}`,
                host: ["{{BASE_URL}}"],
                path: urlPath.split('/').filter(p => p.length > 0)
            }
        }
    };

    if (auth) {
        item.request.auth = {
            type: "bearer",
            bearer: [
                { key: "token", value: userType === 'student' ? "{{STUDENT_TOKEN}}" : "{{TOKEN}}", type: "string" }
            ]
        };
    }

    if (body) {
        item.request.header.push({ key: "Content-Type", value: "application/json" });
        item.request.body = {
            mode: "raw",
            raw: JSON.stringify(body, null, 2)
        };
    }

    folderByUser.item.push(item);
};

const createFolder = (name) => {
    const folder = { name: name, item: [] };
    collection.item.push(folder);
    return folder;
};

// --- AUTH ---
const authFolder = createFolder("Auth");
addRequest(authFolder, "Login", "POST", "/api/v1/auth/login", { email: "admin@example.com", password: "password123" }, false);
addRequest(authFolder, "Create User (Super Admin)", "POST", "/api/v1/auth/create-user", { name: "New User", email: "new@example.com", password: "password", role: "sports_head", assigned_sport_id: 1 });
addRequest(authFolder, "Get All Users (Super Admin)", "GET", "/api/v1/auth/users");
addRequest(authFolder, "Update Profile", "PUT", "/api/v1/auth/profile", { name: "Updated Name" });
addRequest(authFolder, "Delete User (Super Admin)", "DELETE", "/api/v1/auth/users/1");

// --- STUDENT AUTH ---
const studentAuthFolder = createFolder("Student Auth");
addRequest(studentAuthFolder, "Request OTP", "POST", "/api/v1/auth/student/request-otp", { identifier: "student@example.com" }, false);
addRequest(studentAuthFolder, "Verify OTP", "POST", "/api/v1/auth/student/verify-otp", { identifier: "student@example.com", otp: "123456" }, false);

// --- COLLEGES ---
const collegeFolder = createFolder("Colleges");
addRequest(collegeFolder, "Get All Colleges", "GET", "/api/v1/colleges", null, false);
addRequest(collegeFolder, "Create College", "POST", "/api/v1/colleges", { name: "New College", city: "Salem", state: "Tamil Nadu" }, false);
addRequest(collegeFolder, "Bulk Create Colleges", "POST", "/api/v1/colleges/bulk", { colleges: [{ name: "A", city: "X" }, { name: "B", city: "Y" }] }, false);

// --- SPORTS ---
const sportFolder = createFolder("Sports");
addRequest(sportFolder, "Get All Sports", "GET", "/api/v1/sports", null, false);
addRequest(sportFolder, "Create Sport", "POST", "/api/v1/sports", { name: "Cricket", category: "Men", type: "Team", amount: 1000 }, false);

// --- REGISTRATION ---
const regFolder = createFolder("Registration");
addRequest(regFolder, "Register Student (Public)", "POST", "/api/v1/register", { name: "Student", email: "s@test.com", mobile: "9999999999", college_id: 1, sport_ids: [1], transaction_id: "TXN123" }, false);
addRequest(regFolder, "Get Registrations (Protected)", "GET", "/api/v1/register");
addRequest(regFolder, "Get Registration Details (Public/Query)", "GET", "/api/v1/register/details?id=REG-123", null, false);
addRequest(regFolder, "Download Ticket", "GET", "/api/v1/register/ticket?id=REG-123", null, false);
addRequest(regFolder, "Download Check-in", "GET", "/api/v1/register/checkin?id=REG-123", null, false);

// --- STUDENT DASHBOARD ---
const dashboardFolder = createFolder("Student Dashboard");
addRequest(dashboardFolder, "Get Dashboard Stats", "GET", "/api/v1/dashboard", null, true, 'student');
addRequest(dashboardFolder, "Get Team By ID", "GET", "/api/v1/dashboard/teams/1", null, true, 'student');
addRequest(dashboardFolder, "Create Team", "POST", "/api/v1/dashboard/teams", { team_name: "My Team", sport_id: 1 }, true, 'student');
addRequest(dashboardFolder, "Update Team", "PUT", "/api/v1/dashboard/teams/1", { team_name: "Updated Team" }, true, 'student');
addRequest(dashboardFolder, "Delete Team", "DELETE", "/api/v1/dashboard/teams/1", null, true, 'student');
addRequest(dashboardFolder, "Add Team Member", "POST", "/api/v1/dashboard/teams/1/members", { name: "Member", mobile: "8888888888" }, true, 'student');
addRequest(dashboardFolder, "Get Member Details", "GET", "/api/v1/dashboard/members/1", null, true, 'student');
addRequest(dashboardFolder, "Bulk Add Members", "POST", "/api/v1/dashboard/teams/1/members/bulk", { members: [{ name: "A", mobile: "1" }, { name: "B", mobile: "2" }] }, true, 'student');
addRequest(dashboardFolder, "Bulk Update Members", "PUT", "/api/v1/dashboard/members/bulk", { updates: [{ id: 1, name: "New A" }] }, true, 'student');
addRequest(dashboardFolder, "Bulk Delete Members", "DELETE", "/api/v1/dashboard/members/bulk", { ids: [1, 2] }, true, 'student');
addRequest(dashboardFolder, "Update Member", "PUT", "/api/v1/dashboard/members/1", { role: "Captain" }, true, 'student');
addRequest(dashboardFolder, "Patch Member", "PATCH", "/api/v1/dashboard/members/1", { status: "active" }, true, 'student');
addRequest(dashboardFolder, "Delete Member", "DELETE", "/api/v1/dashboard/members/1", null, true, 'student');


// --- ADMIN ---
const adminFolder = createFolder("Admin");
addRequest(adminFolder, "Get Users", "GET", "/api/v1/admin/users");
addRequest(adminFolder, "Create User", "POST", "/api/v1/admin/users", { name: "Admin User", email: "admin@test.com", role: "admin" });
addRequest(adminFolder, "Update User", "PUT", "/api/v1/admin/users/1", { name: "Updated Admin" });
addRequest(adminFolder, "Delete User", "DELETE", "/api/v1/admin/users/1");
addRequest(adminFolder, "Get Registrations", "GET", "/api/v1/admin/registrations");
addRequest(adminFolder, "Verify Payment", "POST", "/api/v1/admin/verify-payment", { registration_id: 1, status: "paid" });
addRequest(adminFolder, "Get Payments", "GET", "/api/v1/admin/payments");
addRequest(adminFolder, "Get Payment Details", "GET", "/api/v1/admin/payments/1");
addRequest(adminFolder, "Request Payment Proof", "POST", "/api/v1/admin/payments/1/request-proof", { reason: "Blurry image" });
addRequest(adminFolder, "Get Analytics", "GET", "/api/v1/admin/analytics");
addRequest(adminFolder, "Match Reports", "GET", "/api/v1/admin/reports/matches");

// --- MATCHES ---
const matchFolder = createFolder("Matches");
addRequest(matchFolder, "Get Live Matches (Public)", "GET", "/api/v1/matches/live", null, false);
addRequest(matchFolder, "Get Matches By Sport (Public)", "GET", "/api/v1/matches/sport/1", null, false);
addRequest(matchFolder, "Get Match Details", "GET", "/api/v1/matches/1", null, false);
addRequest(matchFolder, "Create Match", "POST", "/api/v1/matches", { sport_id: 1, team_a_id: 1, team_b_id: 2, start_time: "2024-01-01T10:00:00Z" });
addRequest(matchFolder, "Update Match", "PUT", "/api/v1/matches/1", { status: "live" });
addRequest(matchFolder, "Delete Match", "DELETE", "/api/v1/matches/1");
addRequest(matchFolder, "Update Score", "PUT", "/api/v1/matches/1/score", { score_a: 10, score_b: 5 });
addRequest(matchFolder, "Get Lineup", "GET", "/api/v1/matches/1/lineup", null, false);
addRequest(matchFolder, "Update Lineup", "POST", "/api/v1/matches/1/lineup", { team_id: 1, players: [1, 2] });
addRequest(matchFolder, "Update Event", "POST", "/api/v1/matches/1/event", { event: "Goal", player_id: 1 });

// --- COMMITTEE ---
const committeeFolder = createFolder("Committee");
addRequest(committeeFolder, "Get Registrations", "GET", "/api/v1/committee/registrations");
addRequest(committeeFolder, "Update Check-in", "PATCH", "/api/v1/committee/checkin/1", { checked_in: true });
addRequest(committeeFolder, "Generate Pass", "GET", "/api/v1/committee/registrations/1/print-pass");
addRequest(committeeFolder, "Get Student Details", "GET", "/api/v1/committee/student/1");

// --- SPORTS HEAD ---
const shFolder = createFolder("Sports Head");
addRequest(shFolder, "Get Overview Stats", "GET", "/api/v1/sports-head/stats");
addRequest(shFolder, "Get Analytics", "GET", "/api/v1/sports-head/analytics");
addRequest(shFolder, "Get Matches", "GET", "/api/v1/sports-head/matches");
addRequest(shFolder, "Schedule Match", "POST", "/api/v1/sports-head/matches/schedule", { team_a: 1, team_b: 2, time: "10:00" });
addRequest(shFolder, "Update Match", "PATCH", "/api/v1/sports-head/matches/1", { status: "completed" });
addRequest(shFolder, "Get Teams", "GET", "/api/v1/sports-head/teams");
addRequest(shFolder, "Create Team", "POST", "/api/v1/sports-head/teams", { team_name: "SH Team", registration_id: 1 });
addRequest(shFolder, "Get Team Details", "GET", "/api/v1/sports-head/teams/1");
addRequest(shFolder, "Update Team", "PUT", "/api/v1/sports-head/teams/1", { team_name: "Updated SH Team" });
addRequest(shFolder, "Delete Team", "DELETE", "/api/v1/sports-head/teams/1");
addRequest(shFolder, "Get Students", "GET", "/api/v1/sports-head/students");
addRequest(shFolder, "Bulk Add Players (New)", "POST", "/api/v1/sports-head/teams/1/players/bulk", { registration_ids: [1, 2] });
addRequest(shFolder, "Add Player", "POST", "/api/v1/sports-head/teams/1/players/1");
addRequest(shFolder, "Update Player (New)", "PUT", "/api/v1/sports-head/teams/1/players/1", { role: "Captain" });
addRequest(shFolder, "Remove Player", "DELETE", "/api/v1/sports-head/teams/1/players/1");
addRequest(shFolder, "Get Registrations", "GET", "/api/v1/sports-head/registrations");

// --- SCORER ---
const scorerFolder = createFolder("Scorer");
addRequest(scorerFolder, "Start Match", "POST", "/api/v1/scorer/matches/1/start");
addRequest(scorerFolder, "Update Score", "PATCH", "/api/v1/scorer/matches/1/score", { team_a_score: 1 });
addRequest(scorerFolder, "Match Event", "POST", "/api/v1/scorer/matches/1/event", { event: "Six" });
addRequest(scorerFolder, "End Match", "POST", "/api/v1/scorer/matches/1/end");

// --- TEAMS ---
const teamFolder = createFolder("Teams");
addRequest(teamFolder, "Get All Teams", "GET", "/api/v1/teams", null, false);
addRequest(teamFolder, "Get Teams By Sport", "GET", "/api/v1/teams/sport/1", null, false);
addRequest(teamFolder, "Get Team By ID", "GET", "/api/v1/teams/1", null, false);
addRequest(teamFolder, "Create Team (Protected)", "POST", "/api/v1/teams", { name: "Team A" });
addRequest(teamFolder, "Update Team (Protected)", "PUT", "/api/v1/teams/1", { name: "Team B" });
addRequest(teamFolder, "Delete Team (Protected)", "DELETE", "/api/v     1/teams/1");

// --- OVERVIEW ---
addRequest(createFolder("Overview"), "Overview Stats", "GET", "/api/v1/overview/stats");

// --- MISC ---
const miscFolder = createFolder("Misc");
addRequest(miscFolder, "Health Check", "GET", "/health", null, false);
addRequest(miscFolder, "Root", "GET", "/", null, false);
addRequest(miscFolder, "Debug Email Config", "GET", "/api/debug-email-config", null, false);
addRequest(miscFolder, "Test Email", "GET", "/api/test-email", null, false);

// WRITE FILE
const outputPath = path.resolve('C:\\Users\\Raghavan Jeeva\\.gemini\\antigravity\\brain\\c700b3d9-7929-4011-b039-38dabed15e84', 'energy_v1_final.json');
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
console.log(`Postman collection generated at: ${outputPath}`);
