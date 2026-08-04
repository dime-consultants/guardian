
# JWT Authentication Implementation

## Overview

The K+N Finance Automation Platform uses JWT (JSON Web Token) authentication with the Django backend. The frontend stores the access token **in memory only** (not in localStorage), while the refresh token is stored as an HTTP-only cookie by Django.

## Architecture

### Authentication Flow

```
Frontend (In Memory)        Backend (Django)
├─ Login Form     ────→    POST /api/auth/login/
│  ├─ email              ├─ Validate credentials
│  └─ password           ├─ Generate JWT tokens
│                        ├─ Set refresh token (HTTP-only cookie)
│                        └─ Return { access, user }
│
├─ Store in memory ←────────── access token
│  setAccessToken(data.access)
│  (NO localStorage)
│
├─ App Load      ────→     GET /api/auth/me/
│  ├─ credentials: "include"  (automatic cookie handling)
│  ├─ Check if valid
│  │  ├─ If valid: restore user state
│  │  └─ If expired/invalid: call refresh
│  │
│  └─ POST /api/auth/refresh/ (uses HTTP-only cookie)
│     └─ Get new access token
│
├─ API Requests  ────→     Protected endpoints
│  ├─ Authorization
│  │  header            ├─ Verify JWT token
│  └─ Bearer {access}   ├─ Return protected data
│                       └─ Response
│
└─ Logout        ────→    POST /api/auth/logout/
   ├─ Clear access token   ├─ Invalidate refresh token
   ├─ Clear user state     └─ Clear HTTP-only cookie
   └─ Memory only
```

## Token Storage Strategy

### Frontend
- **Access Token**: Stored in memory only (React state)
- **Refresh Token**: Handled automatically by browser as HTTP-only cookie
- **User Data**: Stored in memory (React state)

### Why This Approach?
- **Security**: No XSS vulnerability for tokens (in-memory only)
- **Automatic**: Refresh token sent automatically by browser
- **Stateless**: No localStorage dependency
- **Session Restoration**: Call `/api/auth/me/` on app load to restore session

## Backend Endpoints

All endpoints use trailing slashes as per Django URL configuration.

### Authentication Endpoints

#### POST `/api/auth/login/`
Authenticate user with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Welcome back {username}",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "user",
    "name": "John Doe",
    "role": "Finance Manager"
  }
}
```

**Cookies:**
- `refresh_token`: HTTP-only cookie with 7-day expiration

#### POST `/api/auth/signup/`
Register a new user.

**Request:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secure_password123"
}
```

**Response (201):**
```json
{
  "message": "Account created successfully.",
  "user": {
    "id": 2,
    "email": "jane@example.com",
    "username": "jane",
    "name": "Jane Doe"
  }
}
```

#### GET `/api/auth/me/`
Get current user profile. Requires valid JWT token.

**Request Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "user",
  "name": "John Doe",
  "role": "Finance Manager"
}
```

#### POST `/api/auth/refresh/`
Refresh the access token using the refresh token from cookies.

**Response (200):**
```json
{
  "token": "new_access_token..."
}
```

#### POST `/api/auth/logout/`
Logout and invalidate tokens.

**Response (200):**
```json
{
  "message": "Logged out successfully."
}
```

## Frontend Implementation

### Token Storage

Tokens are stored in localStorage for persistence across page reloads:
- `kn-access-token`: JWT access token for API requests
- `kn-refresh-token`: Refresh token (stored as HTTP-only cookie on backend)

### App Context

The `AppProvider` manages authentication state:

```typescript
interface AppContextType {
  user: User | null;                          // Current logged-in user
  isAuthenticated: boolean;                   // Auth state
  accessToken: string | null;                 // JWT token
  login: (email, password) => Promise<void>;  // Login function
  signup: (name, email, password) => Promise<void>;  // Signup function
  logout: () => Promise<void>;                // Logout function
  fetchUserProfile: () => Promise<void>;      // Fetch user data
}
```

### Making Authenticated Requests

Use the `apiRequest` utility to make requests with automatic token inclusion:

```typescript
import { apiRequest } from "@/lib/api-client";

// In a component
const response = await apiRequest(`${backendUrl}/api/auth/me/`, {
  token: accessToken,
});
```

## Token Lifecycle

1. **Login**: User provides credentials → Backend returns access token
2. **Storage**: Token stored in localStorage
3. **Requests**: Every API request includes token in Authorization header
4. **Expiration**: If token expired (401 response), request refresh token
5. **Logout**: Token cleared from localStorage, backend invalidates refresh token

## Security Considerations

### Frontend Security

- Access token stored in localStorage (vulnerable to XSS)
- Refresh token stored as HTTP-only cookie (protected from XSS)
- Always use HTTPS in production
- Implement CSRF protection if needed

### Backend Configuration

Ensure Django settings include:

```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# CORS and HTTPS settings
CSRF_COOKIE_SECURE = True  # Production
SESSION_COOKIE_SECURE = True  # Production
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_HTTPONLY = True
```

## Error Handling

### Common Errors

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| Invalid credentials | 401 | Wrong email/password | Verify credentials |
| User not found | 401 | Email not registered | Create account |
| Token expired | 401 | Access token old | Refresh token |
| Invalid token | 401 | Malformed token | Re-login |

### Retry Logic

Implement automatic refresh on 401:

```typescript
if (response.status === 401) {
  // Try to refresh token
  const newToken = await refreshAccessToken();
  if (newToken) {
    // Retry request with new token
    return apiRequest(url, { token: newToken, ...options });
  } else {
    // Force logout
    await logout();
    router.push("/auth/login");
  }
}
```

## Demo Mode

In demo mode, the frontend:
- Creates mock users without backend calls
- Uses "demo-token" as access token
- Skips all backend authentication
- Allows testing without running Django backend

Enable demo mode in Settings → Demo Mode toggle.

## URL Structure

All backend endpoints follow this pattern:
- No trailing slash after domain: `http://localhost:8000`
- Path includes `/api/` prefix: `/api/auth/login/`
- **All paths end with trailing slash**: `/api/auth/login/`

Examples:
- ✅ Correct: `http://localhost:8000/api/auth/login/`
- ❌ Wrong: `http://localhost:8000/api/auth/login`
- ✅ Correct: `http://localhost:8000/api/auth/me/`
- ❌ Wrong: `http://localhost:8000/api/auth/me`
