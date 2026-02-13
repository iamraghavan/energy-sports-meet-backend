# API Design Specification (RBAC)

This document outlines the planned endpoints for each role, supporting all required HTTP methods and advanced features.

## Role: Admin (Full Access)
**Role Identifier**: `super_admin`
**Scope**: All controllers, global management.

| Endpoint | Method | Purpose | Advanced Features |
| :--- | :--- | :--- | :--- |
| `/api/v1/admin/users` | GET | List all platform users | Pagination, Role Filter |
| `/api/v1/admin/users` | POST | Create a new user (any role) | Password hashing, auto-username |
| `/api/v1/admin/users/:id` | PUT/PATCH | Update user details/role | Audit log trigger |
| `/api/v1/admin/users/:id` | DELETE | Remove a user | Cascade check |
| `/api/v1/admin/registrations` | GET | View all registrations | Export to CSV/Excel |
| `/api/v1/admin/verify-payment` | POST | Approve/Reject payment | **WhatsApp & Email Alert** |
| `/api/v1/admin/reports/matches` | GET | Global match summary report | PDF Generation |
| `/api/v1/admin/analytics` | GET | Registrations, Revenue, etc. | Dynamic chart data |

## Role: Registration Committee
**Role Identifier**: `committee`
**Scope**: Registration management and check-ins.

| Endpoint | Method | Purpose | Advanced Features |
| :--- | :--- | :--- | :--- |
| `/api/v1/committee/registrations` | GET | View/Search registrations | QR Code search support |
| `/api/v1/committee/checkin/:id` | PATCH | Update student check-in status | **FCM Notification** (Optional) |
| `/api/v1/committee/student/:id` | GET | View student profile & status | Dynamic status badges |

## Role: Sports Head
**Role Identifier**: `sports_head`
**Scope**: Management of assigned sport, fixtures, and teams.

| Endpoint | Method | Purpose | Advanced Features |
| :--- | :--- | :--- | :--- |
| `/api/v1/sports-head/matches/schedule` | POST | Create match fixtures | Conflict check |
| `/api/v1/sports-head/matches/:id` | PUT/PATCH | Update match time/venue | **Notification to Teams** |
| `/api/v1/sports-head/teams` | POST | Create a new team | Unique team code |
| `/api/v1/sports-head/teams/:id/players` | POST | Add students to a team | Eligibility check |
| `/api/v1/sports-head/registrations` | GET | View registrations for sport | Filter by gender/category |

## Role: Scorer / Scorekeeper
**Role Identifier**: `scorer`
**Scope**: Live match operations and real-time updates.

| Endpoint | Method | Purpose | Advanced Features |
| :--- | :--- | :--- | :--- |
| `/api/v1/scorer/matches/:id/start` | POST | Mark match as Live | **Socket Broadcast** |
| `/api/v1/scorer/matches/:id/score` | PATCH | Update real-time score | **Socket.io Emit** |
| `/api/v1/scorer/matches/:id/event` | POST | Log match events (e.g. Goal) | Dynamic event timeline |
| `/api/v1/scorer/matches/:id/end` | POST | Finalize match winner | **Notification to Admin** |

## Advanced Features Integration

### 1. Notifications (WhatsApp & Email)
- **Registration**: Sent on successful form submission.
- **Payment Success**: Sent when Admin approves payment.
- **Match Start**: Notifies relevant teams/players when their match is live.

### 2. Live Scoring (WebSockets)
- Scoring updates use a `PATCH` request to persistence, which then triggers a Socket server-side emit to a room specific to that match ID.
- Frontend clients join rooms: `match_{id}`.

### 3. Security
- All routes (except public views) protected by JWT.
- Strict `authorize` middleware per role.
- Input validation on all `POST/PUT/PATCH` requests.
