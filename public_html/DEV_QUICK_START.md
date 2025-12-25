# Pariază Inteligent - Development Quick Start

## Cum pornești serverele

Rulează una dintre aceste comenzi din folderul `public_html`:

### Windows Batch (Recomandat pentru Windows)

```bash
start-dev.bat
```

### PowerShell

```powershell
.\start-dev.ps1
```

## Ce fac scripturile automat

1. ✅ **Opresc procesele vechi** pe porturile 3000 și 3001
2. ✅ **Pornesc API-ul** (Fastify + MySQL) pe port 3001
3. ✅ **Așteaptă 5 secunde** ca API-ul să se inițializeze
4. ✅ **Pornesc frontend-ul Duolingo** (React + Vite) pe port 3000

## URLs disponibile

- **Landing Page (Duolingo UI):** <http://localhost:3000>
- **API Backend:** <http://localhost:3001>
- **API Documentation:** <http://localhost:3001/docs>
- **API Health Check:** <http://localhost:3001/health>

## Features

- 🦉 **Prof. Investino** - Mascota owl prietenoasă
- 💾 **Date Real-Time** - Din MySQL via Fastify API
- 🎨 **Duolingo UI** - Interface jucăuș cu animații
- 🔥 **Live Data Badge** - Indicator conexiune la DB

## Troubleshooting

### Eroare "address already in use"

**Soluție:** Scripturile rezolvă automat problema, oprind procesele vechi.

### Date nu se încarcă

**Verifică:**

1. API-ul rulează pe <http://localhost:3001/health>
2. Response trebuie să fie: `{"status":"ok","database":"connected"}`

### Pagina veche se afișează

**Soluție:** Reîmprospătează browser-ul cu `Ctrl + Shift + R` (hard refresh).

## Cum oprești serverele

Închide ferestrele console/PowerShell deschise de scripturi.
