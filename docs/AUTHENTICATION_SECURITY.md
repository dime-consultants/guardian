# Authentication Security Configuration

## Overview

The K+N Finance Automation Platform implements JWT authentication with environment-based security levels:
- **Production (Default)**: Access tokens stored in memory only + HTTP-only cookies (secure)
- **Development**: Access tokens optionally stored in localStorage for easier debugging

## Environment Variables

### `NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS`
- **Type**: Boolean (string: "true" or "false")
- **Default**: `false` (production/secure mode)
- **Location**: `.env.local` or `.env.production`

#### Values:
| Value | Environment | Token Storage | Use Case |
|-------|---|---|---|
| `false` | Production | Memory only + HTTP-only cookies | **Recommended** - Maximum security, no XSS vulnerabilities |
| `true` | Development | Memory + localStorage | Development/debugging with session persistence across reloads |

## Recommended Setup

### Development Environment (`.env.local`)
```env
# Allow localStorage token persistence for debugging
NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=true
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_DEMO_MODE=false
```

### Production Environment (`.env.production` / Vercel Deployment)
```env
# Secure mode: tokens in memory only
NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
NEXT_PUBLIC_DEFAULT_DEMO_MODE=false
```

## How It Works

### Mode: false (Production - Default)

```typescript
// Token Storage
├─ Access Token
│  ├─ Location: React state (memory) only
│  ├─ XSS Safe: ✅ Not accessible to JavaScript
│  └─ Survives Reload: ❌ Lost on page refresh
│
├─ Refresh Token
│  ├─ Location: HTTP-only cookie (backend set)
│  ├─ XSS Safe: ✅ Cannot be accessed by JavaScript
│  └─ CSRF Protected: ✅ SameSite & browser validation
│
└─ User Session
   ├─ Location: React state (memory) only
   ├─ Persisted: ❌ Restored from /api/auth/me/ on app load
   └─ Security: ✅ Maximum
```

**Flow on App Load:**
```
1. App mounts
2. Call GET /api/auth/me/ with credentials (sends HTTP-only refresh cookie)
3. If valid: Restore user state from response
4. If expired/invalid: Auto-refresh token using /api/auth/refresh/ endpoint
5. If refresh fails: Logout user
```

### Mode: true (Development - With localStorage)

```typescript
// Token Storage
├─ Access Token
│  ├─ Location: React state + localStorage
│  ├─ XSS Safe: ⚠️ Accessible to JavaScript (development only)
│  └─ Survives Reload: ✅ Restored on page refresh
│
├─ Refresh Token
│  ├─ Location: HTTP-only cookie (backend set)
│  ├─ XSS Safe: ✅ Cannot be accessed by JavaScript
│  └─ CSRF Protected: ✅ SameSite & browser validation
│
└─ User Session
   ├─ Location: React state + localStorage
   ├─ Persisted: ✅ Survives page reload
   └─ Security: ⚠️ Lower (development only)
```

**Advantage:** Session persists across page reloads for easier debugging.

## API Endpoint Authentication

All endpoints require proper authentication as configured in Django backend:

### Protected Endpoints (Require JWT)
```
GET  /api/auth/me/                          - Bearer token required ✅
GET  /api/chat/conversations/               - Bearer token required ✅
POST /api/chat/conversations/               - Bearer token required ✅
GET  /api/chat/conversations/<id>/          - Bearer token required ✅
PATCH /api/chat/conversations/<id>/         - Bearer token required ✅
DELETE /api/chat/conversations/<id>/        - Bearer token required ✅
GET  /api/chat/conversations/<id>/messages/ - Bearer token required ✅
POST /api/chat/conversations/<id>/send/     - Bearer token required ✅
GET  /api/chat/attachments/<id>/download/   - Bearer token required ✅
POST /api/chat/message/                     - Bearer token required ✅
POST /api/chat/process-file/                - Bearer token required ✅
POST /api/chat/convert-format/              - Bearer token required ✅
POST /api/chat/export-data/                 - Bearer token required ✅
GET  /api/chat/history                      - Bearer token required ✅
GET  /api/chat/workflows/                   - Bearer token required ✅
GET  /api/chat/workflows/defaults/          - Bearer token required ✅
```

### Public Endpoints (No Authentication)
```
POST /api/auth/login/    - Public (credentials validation)
POST /api/auth/signup/   - Public (user registration)
```

### Authenticated Endpoints (JWT Required)
```
GET  /api/auth/me/           - Bearer token required
POST /api/auth/refresh/      - Refresh cookie required (in credentials)
POST /api/auth/logout/       - Bearer token required
```

## Request Headers

All API requests include:

```javascript
const headers = {
  "Authorization": `Bearer ${accessToken}`,
  "Content-Type": "application/json"
};

const options = {
  headers,
  credentials: "include"  // Important: sends HTTP-only cookies
};
```

## Frontend Implementation

### In `contexts/app-context.tsx`:
```typescript
// Read environment flag
const useLocalStorage = process.env.NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS === "true";

// On app load - restore session
if (useLocalStorage) {
  const savedToken = localStorage.getItem("kn-access-token");
  if (savedToken) setAccessToken(savedToken);
}

// On token update - conditionally persist
useEffect(() => {
  if (useLocalStorage) {
    if (accessToken) {
      localStorage.setItem("kn-access-token", accessToken);
    } else {
      localStorage.removeItem("kn-access-token");
    }
  }
}, [accessToken, useLocalStorage]);
```

## Django Backend Requirements

All views must use proper authentication:

```python
from rest_framework import permissions
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication

class MyAPIView(APIView):
    # Accept both session auth (cookies) and JWT (Bearer tokens)
    authentication_classes = [SessionAuthentication, JWTAuthentication]
    
    # Require authentication on all methods
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # request.user is automatically set if authenticated
        if not request.user:
            return Response({"error": "Not authenticated"}, status=401)
        # ...
```

## Security Benefits by Mode

### Production Mode (false) - Maximum Security
✅ **XSS Protection**: Tokens cannot be stolen by malicious JavaScript
✅ **CSRF Protection**: HTTP-only cookies + SameSite validated
✅ **Session Isolation**: Each browser session is independent
✅ **Best for**: Production deployments, sensitive data

### Development Mode (true) - Debugging Convenience
⚠️ **Lower XSS Protection**: Tokens accessible to JavaScript (intentional for debugging)
✅ **Session Persistence**: Session survives page reloads
✅ **Easier Debugging**: Can inspect tokens in browser console
⚠️ **Not recommended**: For production use

## Deployment Checklist

- [ ] Set `NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false` in Vercel Production environment variables
- [ ] Verify Django backend has `SECURE_COOKIE_HTTPONLY=True`
- [ ] Verify Django backend has `SECURE_COOKIE_SECURE=True` (HTTPS only)
- [ ] Verify Django backend has `CSRF_COOKIE_SECURE=True`
- [ ] Verify Django backend has `CSRF_COOKIE_HTTPONLY=True`
- [ ] All API endpoints use `permission_classes = [permissions.IsAuthenticated]`
- [ ] Test login/logout flow
- [ ] Test 401 response triggers automatic refresh
- [ ] Test logout clears session
- [ ] Monitor security logs for suspicious patterns

## Testing

### Test localStorage disabled (production mode):
```bash
# In .env.local
NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false

# Open browser DevTools → Application → Storage
# Verify: NO "kn-access-token" in localStorage after login
# Verify: "kn-demo-mode" and "kn-backend-url" still persisted
```

### Test localStorage enabled (development mode):
```bash
# In .env.local
NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=true

# Open browser DevTools → Application → Storage
# Verify: "kn-access-token" appears in localStorage after login
# Verify: Token persists after page reload
# Verify: Logout removes token from localStorage
```

## Troubleshooting

### "401 Unauthorized" on API calls
**Possible causes:**
- Token expired (check refresh endpoint)
- Token not included in Authorization header
- Backend not validating JWT correctly
- Refresh token cookie not set by Django

**Solution:**
1. Check Network tab to see if Authorization header is present
2. Verify Django backend returns refresh token as HTTP-only cookie
3. Test refresh endpoint manually: `POST /api/auth/refresh/`

### Session lost after page reload (localStorage disabled)
**This is expected behavior in production mode.**
- Session is restored from backend via `/api/auth/me/` call
- If no session exists, user redirected to login

### Token always in localStorage (shouldn't be in production)
**Solution:**
1. Verify `.env.production` or Vercel env vars have `NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS=false`
2. Clear browser cache and local storage
3. Rebuild deployment
4. Verify `process.env.NEXT_PUBLIC_USE_LOCALSTORAGE_TOKENS` is "false" not true

## References

- [OWASP: Cross-Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/)
- [OWASP: Cross-Site Request Forgery (CSRF)](https://owasp.org/www-community/attacks/csrf)
- [MDN: HTTP-only Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Django SimpleJWT](https://django-rest-framework-simplejwt.readthedocs.io/)
