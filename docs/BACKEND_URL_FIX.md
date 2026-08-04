# Backend URL Configuration Fix

## Problem

Frontend was hardcoded to `http://localhost:8000`, which only works on the server itself. When accessed from a browser, it tries to connect to `localhost` on the client machine, causing `ERR_CONNECTION_REFUSED`.

## Solution

Configure the frontend to use the actual backend domain.

### Files Updated

1. **contexts/app-context.tsx**
   - Changed default backend URL from `http://localhost:8000` to `https://invoicing.dimeconsultants.africa`
   - Frontend now connects to the correct backend domain

2. **.env.local**
   - `NEXT_PUBLIC_BACKEND_URL=https://invoicing.dimeconsultants.africa`
   - This overrides the default for your deployment

### Configuration Flow

```
Browser on Client Machine
    ↓
Tries to reach NEXT_PUBLIC_BACKEND_URL
    ↓
https://invoicing.dimeconsultants.africa (NEW - FIXED)
    ↓
Your Django Backend API
```

**Before** (BROKEN):
```
Browser tries: http://localhost:8000 ❌
(localhost resolves to client machine, not server)
```

**After** (FIXED):
```
Browser tries: https://invoicing.dimeconsultants.africa ✓
(resolves to your VPS via DNS)
```

## Deployment Steps

On your VPS (in `/Dime-Consultants-K-N`):

```bash
# 1. Pull latest changes
git pull origin main

# 2. Rebuild with new env vars
docker-compose down
docker-compose up -d --build

# 3. Check if it's working
curl -I https://invoicing.dimeconsultants.africa/api/health/
```

Wait 1-2 minutes for containers to start, then test in browser.

## Test in Browser

1. Open: https://kuehne.dimeconsultants.africa
2. Try to sign up or login
3. Check browser console (F12 → Console tab)
4. Should see successful API calls instead of `ERR_CONNECTION_REFUSED`

## API Endpoints

All endpoints must now use your domain:

| Endpoint | Old (Broken) | New (Fixed) |
|----------|---|---|
| Signup | `POST http://localhost:8000/api/auth/signup/` | `POST https://invoicing.dimeconsultants.africa/api/auth/signup/` |
| Login | `POST http://localhost:8000/api/auth/login/` | `POST https://invoicing.dimeconsultants.africa/api/auth/login/` |
| Me | `GET http://localhost:8000/api/auth/me/` | `GET https://invoicing.dimeconsultants.africa/api/auth/me/` |
| Health | `GET http://localhost:8000/api/health/` | `GET https://invoicing.dimeconsultants.africa/api/health/` |

## Environment Variables

The frontend reads from:

```env
# In .env.local (or .env)
NEXT_PUBLIC_BACKEND_URL=https://invoicing.dimeconsultants.africa
```

This is picked up automatically when you:
1. Set it in .env.local
2. Rebuild: `docker-compose up -d --build`
3. Restart: `docker-compose restart kn-finance-app`

## Verification

Check browser network tab (F12 → Network):

**Before**: Requests to `http://localhost:8000` → ERR_CONNECTION_REFUSED
**After**: Requests to `https://invoicing.dimeconsultants.africa` → 200/201

## Custom Backend URL

If your backend is on a different domain, edit .env.local:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com
```

Then rebuild:
```bash
docker-compose up -d --build
```

---
**Fixed**: Frontend now connects to actual backend domain instead of localhost
**Status**: Ready for testing
