# Frontend Architecture

## Single Source of Truth

**Frontend Principal:** `pariaza-inteligent/`

**Design:** Duolingo-style (Prof. Investino mascot, fond luminos, playful)

**Port:** 3000

**Comandă start:**

```bash
cd pariaza-inteligent
npm run dev
```

## Folder Eliminat/Dezactivat

**Folder:** `public_html/apps/_deprecated_web_legacy` (redenumit din `web-public`)

**Motiv:** Design dark industrial/cyberdeck, nu Duolingo. Confuzie cu platforma principală.

**Acțiuni:**

- Redenumit în `_deprecated_web_legacy` pentru dezactivare clară
- Nu mai poate fi pornit accidental prin turbo
- Păstrat pentru referință, dar nu este platforma activă

## Regulă

**NU se mai adaugă landing-uri paralele fără acord explicit.**

**Un singur frontend activ: `pariaza-inteligent/`**

Dacă există nevoie de frontend secundar (investor dashboard, admin panel), se creează în `public_html/apps/` cu nume distinct și documentat aici.

## API Backend

**Folder:** `public_html/apps/api/`

**Port:** 3001

**Comandă start:**

```bash
cd public_html/apps/api
npm run dev
```

**Database:** MySQL `u45947pari_pariaza_inteligent` (credentials în `_ai/database_credentials.md`)

## Data Flow

```
Frontend (pariaza-inteligent:3000)
  ↓ fetch
API (apps/api:3001)
  ↓ Prisma
MySQL Database (u45947pari_pariaza_inteligent)
```

**Ultimă actualizare:** 2025-12-26

## Pornire Rapidă Platformă (Launcher)

**Fișier:** `start-pariaza-inteligent.bat` (în root folder)

**Locație:** `C:\Users\tomiz\Desktop\-home-u45947pari\start-pariaza-inteligent.bat`

**Ce face:**

1. Oprește procese vechi pe porturile 3000, 3001, 3002
2. Pornește API Backend (port 3001)
3. Pornește Frontend Duolingo (port 3000)
4. Deschide automat browser-ul pe <http://localhost:3000>

**Utilizare:** Dublu-click pe fișier.

**Timp start:** ~12 secunde total.
