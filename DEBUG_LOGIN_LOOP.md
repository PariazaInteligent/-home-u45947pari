# Debug Login Loop - Quick Instructions

## Step 1: Kill Node Processes (Fix EPERM)

```powershell
# Open Task Manager (Ctrl+Shift+Esc)
# Find all "Node.js" processes → End Task
# Or via PowerShell:
taskkill /F /IM node.exe
```

## Step 2: Prisma Generate + Rebuild

```bash
cd c:\Users\tomiz\Desktop\-home-u45947pari\public_html\packages\database
npx prisma generate
npm run build
```

## Step 3: Restart API

```bash
# Stop API if running (Ctrl+C in terminal)
# Then restart:
cd c:\Users\tomiz\Desktop\-home-u45947pari
start-pariaza-inteligent.bat
```

## Step 4: Test Direct API Call

1. Open browser → Login → F12 DevTools
2. Go to Application → Local Storage → copy `accessToken`
3. Open new tab → F12 Console
4. Run:

```javascript
fetch('http://localhost:3001/api/users/me', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN_HERE' }
}).then(r => r.json()).then(d => console.log('Status:', d))
```

## Expected Results

- **200** + user data → OK, frontend issue
- **401** + "Invalid token" → Token problem (expired/invalid signature)
- **500** + error → Backend crash (check Prisma types)
- **Connection refused** → API not running

## Frontend Logging (Already Added)

Check browser console for:

- `🔑 [ProfilePage] Token exists?` - should show YES
- `📊 [ProfilePage] /api/users/me response status:` - shows exact HTTP code
- `❌ [ProfilePage] API error` - if 500/503, shows error without redirect

## Backend Logging (Already Added)

Check API terminal for:

- `🔐 [Auth Middleware] Authorization header present?` - should be YES
- `✅ [Auth Middleware] JWT verified successfully` - if OK
- `❌ [Auth Middleware] JWT verification failed` - with reason (expired/invalid)
