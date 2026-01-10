
# Analiză Eroare 429 (Too Many Requests)

## Simptome

La încercarea de a testa fluxurile de înregistrare, login sau setare parolă din browser (sau scripturi repetate), serverul a răspuns cu `429 Too Many Requests`.

## Cauza Identificată

În fișierul `apps/api/src/routes/auth.routes.ts`, rutele critice (`/register`, `/login`, `/set-password`) au configurată o limită extrem de restrictivă:

```typescript
config: {
    rateLimit: {
        max: 5,
        timeWindow: '15 minutes',
    },
},
```

Aceasta înseamnă că **după 5 cereri** de pe același IP (localhost în cazul dezvoltării), orice cerere ulterioară este blocată timp de **15 minute**.

În timpul testării (mai multe încercări, reload-uri, sau execuții automate), această limită este atinsă aproape instantaneu.

## Soluție Recomandată (Dev vs Prod)

### 1. Relaxare în Development

În mediul local, rate limit-ul ar trebui să fie mult mai permisiv sau dezactivat.

**Modificare propusă:**
Folosirea unei variabile de mediu sau condiționarea configurării:

```typescript
const isDev = process.env.NODE_ENV === 'development';
const limitConfig = {
    max: isDev ? 1000 : 5, // 1000 în dev, 5 în prod
    timeWindow: '15 minutes'
};
```

### 2. Configurare Hard-coded (Fix Rapid)

Schimbarea valorii `max` la `100` în `auth.routes.ts` pentru a permite testarea fără blocaje.

```typescript
rateLimit: {
    max: 100, // Crescut de la 5
    timeWindow: '15 minutes',
},
```
