# ☀️ TODO MÂINE - 2026-01-09

## 🔴 URGENT - RESTART NECESAR

### 1. Restart API Server

```bash
# Motive: Fix timezone aplicat (Math.floor în loc de Math.ceil)
# Locație: public_html/apps/api/src/routes/user.routes.ts:597

cd public_html/apps/api
npm run dev
# sau restart cu tool-ul tău obișnuit
```

**CE SE VA SCHIMBA**:

- "1 zi în urmă" → "0 zile" (pentru schimbări recente < 24h)
- Display corect pentru zile COMPLETE doar

---

## ✅ TESTARE POST-RESTART

### Test 1: Verifică Display Zile

1. Login: `admin@pariazainteligent.ro` / `3DSecurity31` ⭐
2. Navigate `/profile` → Settings
3. Security Center → Schimbă Parola
4. **Verifică**: Ar trebui "0 zile în urmă" (nu "1 zi")

### Test 2: Schimbă Parola Înapoi (Opțional)

Dacă vrei să revii la parola standard pentru teste:

- Current: `3DSecurity31`
- New: `password123`
- Confirm: `password123`

---

## 📋 FEATURES NEFINALIZATE (Opțional)

### A. Confetti Animation

**Status**: Implementat dar poate nu se vede clar  
**Locație**: `ChangePasswordModal.tsx:70-75`

**Verifică**:

- La success, ar trebui să apară 100 particule colorate
- Dacă nu merge, verifică import `canvas-confetti`

```typescript
confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#58CC02', '#FF9600', '#7C3AED', '#1CB0F6']
});
```

### B. Display Friendly pentru Ore

**Idee**: În loc de "0 zile", arată "câteva ore" sau "schimbată astăzi"

**Cod sugestie** (backend):

```typescript
let displayText: string;
if (daysSinceChange === 0) {
    const hoursSince = Math.floor(diffTime / (1000 * 60 * 60));
    displayText = hoursSince === 0 ? 'schimbată recent' : `${hoursSince} ore în urmă`;
} else {
    displayText = `${daysSinceChange} ${daysSinceChange === 1 ? 'zi' : 'zile'} în urmă`;
}
```

### C. Email Notification

**Feature**: Trimite email când parola e schimbată  
**Locație**: `user.routes.ts:710` (după success)

**Email template**:

```
Subject: 🔐 Parolă schimbată - Pariază Inteligent

Bună {name},

Parola ta a fost schimbată cu succes pe {date} la {time}.

Detalii:
- IP Address: {ip}
- Device: {userAgent}

Dacă nu ai fost tu, contactează-ne imediat!

Echipa Pariază Inteligent
```

### D. Rate Limiting

**Security**: Max 3 încercări la change-password / 15 min

**Implementare**:

- Redis cache pentru tracking attempts
- Sau simplu: count în memory cu IP key
- Return 429 Too Many Requests după 3 fails

---

## 🐛 BUG WATCH

### Issues cunoscute REZOLVATE

- ✅ getApiUrl() crash (fix aplicat)
- ✅ Text contrast slab (fix aplicat)
- ✅ Timezone Math.ceil (fix aplicat - NEEDS RESTART!)

### Potential Issues (monitor)

- [ ] Confetti nu apare vizibil
- [ ] Toast achievement se închide prea repede
- [ ] Security score nu se recalculează instant

---

## 📚 DOCUMENTAȚIE DISPONIBILĂ

În `/_ai/`:

- ✅ `SESIUNE_2026-01-08_SCHIMBA_PAROLA_FINAL.md` - Documentație completă
- ✅ `CREDENTIALE_2026-01-08.txt` - Parola nouă: `3DSecurity31`
- ✅ `TODO_MAINE.md` - Acest fișier

În `brain/`:

- ✅ `implementare_schimba_parola.md` - Detalii backend/frontend
- ✅ `walkthrough_schimba_parola_success.md` - Browser test results

---

## 🚀 DEPLOYMENT CHECKLIST

Când e gata pentru production:

### Pre-Deploy

- [ ] Code review final
- [ ] Test pe staging environment
- [ ] Backup database (users + audit_logs)
- [ ] Check all environment variables

### Deploy

- [ ] Deploy backend API (`user.routes.ts`)
- [ ] Deploy frontend (`ChangePasswordModal.tsx`, `ProfilePage.tsx`)
- [ ] Run database migrations dacă sunt necesare
- [ ] Restart API servers

### Post-Deploy

- [ ] Smoke test: login + schimbă parola
- [ ] Monitor logs pentru errors
- [ ] Check audit_logs în DB
- [ ] Verify email notifications (dacă implementat)

---

## 💡 QUICK WINS MÂINE

Priority LOW effort, HIGH impact:

1. **Display "astăzi" în loc de "0 zile"** (5 min)
2. **Email notification** (30 min cu template simplu)
3. **Rate limiting** (20 min cu IP tracking simplu)

---

**📅 Created**: 2026-01-08 23:18  
**✨ Status**: Ready pentru mâine!

**Parola curentă**: `3DSecurity31` ⭐  
**Login email**: `admin@pariazainteligent.ro`

Mult succes mâine! 🚀
