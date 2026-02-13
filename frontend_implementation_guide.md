# Frontend Implementation Guide

This guide provides technical details on how to integrate the frontend application with the **Energy Sports Meet API**.

## 1. Authentication & Role Handling

### Login Flow
- Endpoint: `POST /api/v1/auth/login`
- Response: Contains `token` and `role`.
- **Action**: Store the JWT token in `localStorage` or a secure cookie. Store the `role` in your state management (Redux/Zustand/Context).

### Persistent Auth
Always include the token in the `Authorization` header:
```javascript
// Example using Axios Interceptor
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Role-Based Routing (Pseudo-code)
```javascript
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Redirect to="/unauthorized" />;
  return children;
};
```

---

## 2. Dashboard Modules by Role

### Admin Dashboard (`super_admin`)
- **Stats**: Total registrations, revenue, analytics.
- **Tools**: User management (CRUD), payment verification.
- **API**: `/api/v1/admin/analytics`, `/api/v1/admin/verify-payment`.

### Committee Dashboard (`committee`)
- **Tools**: Student lookup (QR Search), Check-in toggle.
- **API**: `/api/v1/committee/registrations`, `/api/v1/committee/checkin/:id`.

### Sports Head Dashboard (`sports_head`)
- **Tools**: Schedule matches, manage teams in assigned sport.
- **API**: `/api/v1/sports-head/matches/schedule`, `/api/v1/sports-head/teams`.

### Scorer Dashboard (`scorer`)
- **Tools**: Live scoreboard interface, event logger (goal, wicket, etc.).
- **API**: `/api/v1/scorer/matches/:id/score`, `/api/v1/scorer/matches/:id/event`.

---

## 3. Real-Time Socket Integration

### Connection
Connect to the socket server once the user enters a match or dashboard view.
```javascript
import { io } from "socket.io-client";
const socket = io(BACKEND_URL);
```

### Subscribing to Updates
- **Global Overview**: Join `live_overview` to get updates for all matches.
- **Match Detail**: Join a specific match room using `matchId`.

```javascript
// Join a room
socket.emit('join_match', matchId);

// Listen for score updates
socket.on('score_update', (data) => {
  console.log('New Score:', data.score_details);
  // Update your local state to reflect the score instantly
});

// Listen for critical events
socket.on('match_event', (event) => {
  toast.info(`${event.type.toUpperCase()}: ${event.commentary}`);
});
```

---

## 4. Notification Triggers
The backend handles WhatsApp and Email automatically when:
- Payment is **Approved** (Admin clicks verify).
- Match is **Live** (Scorer starts match).
- Match **Ends** (Scorer finalizes).

**Frontend Tip**: Show a success toast when these actions are performed to reassure the user that notifications are being sent.

---

## 5. Mock JSON for Dynamic UI
Use the `GET /api/v1/admin/analytics` data to build dynamic charts using libraries like `Recharts` or `Chart.js`.
```json
{
  "stats": {
    "totalRegistrations": 500,
    "approvedPayments": 450,
    "collectionRate": "90.00"
  },
  "sports": [
    { "Sport": { "name": "Cricket" }, "count": 200 },
    { "Sport": { "name": "Football" }, "count": 300 }
  ]
}
```
