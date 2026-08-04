# Demo Mode and Live Backend Configuration

## Overview

The frontend supports both **demo mode** (for testing/development) and **live backend communication** (production). Both modes can coexist, allowing you to switch between them as needed.

## Demo Mode

Demo mode provides mock data and simulates the application without requiring a backend connection.

### Enabling Demo Mode

**In Browser:**
1. Open Settings (gear icon, top right)
2. Toggle "Demo Mode" ON
3. All data becomes simulated/mocked

**In Code:**
```typescript
// Via environment variable
NEXT_PUBLIC_DEFAULT_DEMO_MODE=true

// Or via app context
const { setDemoMode } = useApp();
setDemoMode(true);
```

### When Demo Mode is ON

- Backend calls are skipped
- All data is mocked locally
- No authentication required (optional)
- Perfect for UI development and testing

### When Demo Mode is OFF

- Frontend communicates with real backend
- Requires valid credentials
- Depends on backend availability
- Production mode

## Live Backend Configuration

When demo mode is OFF, the frontend communicates with your Django backend using the API spec.

### Backend API Endpoints

**Base URL**: `https://invoicing.dimeconsultants.africa/api`

#### Authentication

**POST** `/api/auth/signup/`
```json
{
  "email": "user@example.com",
  "password": "Test1234!",
  "password2": "Test1234!",
  "first_name": "Luther",
  "last_name": "Isaboke",
  "department": "Finance",
  "phone": "0712345678"
}
```
Response: `201` with user object and confirmation message

**POST** `/api/auth/login/`
```json
{
  "email": "user@example.com",
  "password": "Test1234!"
}
```
Response: `200` with `token`, `user`, and `message`

**POST** `/api/auth/logout/`
No body required. Auth required (Bearer token).
Response: `200` with confirmation message

**GET** `/api/auth/me/`
Auth required. Returns current user profile.

**POST** `/api/auth/refresh/`
No body required. Uses HttpOnly refresh_token cookie.
Response: `200` with new `token`

#### Health Check

**GET** `/api/health/`
No auth required.
```json
{
  "status": "ok",
  "timestamp": "2026-06-05T12:00:00+03:00",
  "database": "ok",
  "version": "1.0.0"
}
```

## Frontend Token Handling

### Token Storage

**Development** (`NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=true`):
- Access token stored in localStorage (for easy debugging)
- Refresh token in HttpOnly cookie

**Production** (`NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false`):
- Access token stored in memory only (more secure)
- Refresh token in HttpOnly cookie (automatic refresh)

### Token Lifecycle

1. **Login**: Backend returns `token` and sets `refresh_token` cookie
2. **Requests**: Frontend sends `Authorization: Bearer <token>` header
3. **Expiration**: Frontend detects 401, calls refresh endpoint
4. **Refresh**: Backend uses HttpOnly cookie to issue new token
5. **Logout**: Frontend clears memory, backend clears cookie

### Environment Configuration

Set in `.env.local`:

```env
# Backend URL (defaults to https://invoicing.dimeconsultants.africa)
NEXT_PUBLIC_BACKEND_URL=https://invoicing.dimeconsultants.africa

# Token storage security (dev=localStorage, prod=memory)
NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false

# Initial demo mode state (true=start in demo, false=start in live)
NEXT_PUBLIC_DEFAULT_DEMO_MODE=false
```

## Switching Modes

### From Settings UI

1. Click Settings (gear icon)
2. Toggle "Demo Mode"
3. If turning OFF: You'll need to login with real credentials
4. If turning ON: Demo data appears immediately

### Programmatically

```typescript
import { useApp } from "@/contexts/app-context";

export function MyComponent() {
  const { demoMode, setDemoMode } = useApp();

  return (
    <button onClick={() => setDemoMode(!demoMode)}>
      {demoMode ? "Switch to Live" : "Switch to Demo"}
    </button>
  );
}
```

## Testing the Backend

### Test Credentials

```
Email: test@test.com
Password: Test1234!
```

Or create new accounts via signup endpoint.

### Test Login Flow

```bash
# 1. Signup
curl -X POST https://invoicing.dimeconsultants.africa/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"Test1234!",
    "password2":"Test1234!",
    "first_name":"Test",
    "last_name":"User",
    "department":"IT",
    "phone":"0712345678"
  }'

# 2. Login
curl -X POST https://invoicing.dimeconsultants.africa/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email":"user@example.com",
    "password":"Test1234!"
  }'

# Response includes:
# - "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
# - "user": { user object }

# 3. Test profile endpoint
curl -X GET https://invoicing.dimeconsultants.africa/api/auth/me/ \
  -H "Authorization: Bearer <token_from_step_2>"
```

### Test in Browser

1. Turn OFF demo mode
2. Clear any previous login
3. Go to Sign Up page
4. Create account with test credentials
5. Should redirect to dashboard
6. Open DevTools → Network tab
7. Verify API calls to `/api/auth/signup/` and `/api/auth/login/`

## Troubleshooting

### "401 Unauthorized"
- Token expired: Refresh token will be sent automatically
- Invalid token: Logout and login again
- Backend down: Check `/api/health/` endpoint

### "400 Bad Request"
- Check payload matches API spec exactly
- Verify Content-Type header: `application/json`
- Validate email format, password strength

### Can't Connect to Backend
- Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly
- Check DNS resolution: `nslookup invoicing.dimeconsultants.africa`
- Verify SSL certificate is valid
- Check CORS headers from backend

### Demo Mode Data Not Appearing
- Ensure `demoMode` is `true` in settings
- Check browser console for errors
- Verify localStorage isn't corrupted

## Frontend API Contract

The frontend expects this response shape from backend:

**Login/Signup Response:**
```typescript
interface LoginResponse {
  token: string;        // JWT access token (Bearer scheme)
  user: {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    name: string;       // "first_name last_name"
    role: string;       // "viewer", "editor", "admin"
    role_display: string;
    status: string;
    lastActive: string; // ISO 8601 timestamp
    department: string;
    phone: string;
    is_active: boolean;
    created_at: string; // ISO 8601 timestamp
  };
  message?: string;
}

interface RefreshResponse {
  token: string;        // New JWT access token
}

interface ProfileResponse {
  // Same shape as user object above
}
```

## Development Workflow

### Scenario 1: UI Development (Use Demo)
```
1. Start with: NEXT_PUBLIC_DEFAULT_DEMO_MODE=true
2. Build UI with mock data
3. No backend needed
4. Toggle OFF to test real API later
```

### Scenario 2: Backend Integration (Use Live)
```
1. Start with: NEXT_PUBLIC_DEFAULT_DEMO_MODE=false
2. Ensure backend is running
3. Test signup/login flows
4. Toggle ON for comparison with demo
```

### Scenario 3: Debugging (Toggle Between)
```
1. Turn demo ON: See expected UI behavior
2. Turn demo OFF: Test real backend
3. Compare network requests in DevTools
4. Fix any mismatches in payload or response handling
```

## Deployment Checklist

- [ ] Set `NEXT_PUBLIC_DEFAULT_DEMO_MODE=false` in production
- [ ] Set `NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false` in production
- [ ] Verify `NEXT_PUBLIC_BACKEND_URL` points to correct domain
- [ ] Test signup, login, and logout flows
- [ ] Verify SSL certificate is valid
- [ ] Check CORS is configured on backend
- [ ] Test token refresh after expiration
- [ ] Verify HttpOnly cookies are being set

---
**Frontend**: https://kuehne.dimeconsultants.africa
**Backend**: https://invoicing.dimeconsultants.africa
**API Base**: https://invoicing.dimeconsultants.africa/api
