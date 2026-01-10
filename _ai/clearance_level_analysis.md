# Clearance Level - Analiză Sistem

**Date:** 2026-01-03  
**Status:** Câmp DB Static (Manual Only)

---

## Răspunsuri la Întrebările Tale

### ① Clearance Level vine dintr-un câmp DB sau este derivat?

**Răspuns:** ✅ **Câmp DB Direct (Static)**

**Locație:**

- **Schema Prisma:** `clearanceLevel Int @default(1)`
- **Tabelă MySQL:** `users.clearance_level INT NOT NULL DEFAULT 1`
- **Comentariu DB:** `'Access level (1-5)'`

**Cod:**

```prisma
// schema.prisma
model User {
  clearanceLevel Int @default(1) @map("clearance_level")
}
```

```sql
-- Migration SQL
ADD COLUMN `clearance_level` INT NOT NULL DEFAULT 1 COMMENT 'Access level (1-5)'
```

**Concluzie:** Este un **câmp persistent în DB**, NU derivat/calculat. Valoarea este stocată direct în tabela `users`.

---

### ② Există tabelă/config cu praguri sau este valoare fixă?

**Răspuns:** ❌ **NU există tabelă de configurare praguri**

**Situația Actuală:**

- **Valoare default:** `1` (hardcoded în schema)
- **Range documentat:** `1-5` (din comentariu SQL)
- **Logică calcul:** ABSENT - nicio logică automată de promovare
- **Update mecanism:** Manual only (prin admin)

**Ce LIPSEȘTE:**

```typescript
// NU EXISTĂ această tabelă:
model ClearanceLevelConfig {
  level            Int
  requiredStreak   Int?
  requiredLoyalty  Int?
  requiredTier     String?
  requiredInvest   Decimal?
}
```

**Comparație cu Tier System:**

| Feature | Tier (league_tiers) | Clearance Level |
|---------|---------------------|-----------------|
| Tabelă config | ✅ YES (`league_tiers`) | ❌ NO |
| Praguri definite | ✅ YES (minInvestment, minStreak, minLoyalty) | ❌ NO |
| Logică calcul | ✅ Cache service | ❌ ABSENT |
| API management | ✅ CRUD endpoints | ❌ ABSENT |

**Concluzie:** Clearance level este **valoare fixă/manuală**, FĂRĂ sistem de praguri configurabile.

---

### ③ Se recalculează automat la modificarea datelor și este auditabil?

**Răspuns:** ❌ **NU se recalculează automat, NU este auditabil**

**Verificare Cod:**

```bash
# Căutare logică update clearanceLevel:
grep -r "clearanceLevel.*=" apps/api/src/
# REZULTAT: 0 matches

# Căutare UPDATE clearance:
grep -ri "UPDATE.*clearance" apps/api/src/
# REZULTAT: 0 matches
```

**Ce LIPSEȘTE:**

1. **Auto-recalculare:** Nicio logică de trigger la modificare streak/loyalty/tier
2. **Service Layer:** Nu există `ClearanceLevelService`
3. **API Endpoints:** Nu există PATCH/PUT pentru clearance level
4. **Audit Trail:** Nu există înregistrări în `audit_logs` pentru clearance changes

**Comparație cu Loyalty System (care ESTE auditabil):**

| Feature | Loyalty Points | Clearance Level |
|---------|----------------|-----------------|
| Auto-update on event | ✅ YES (check-in → +10 pts) | ❌ NO |
| Service logic | ✅ YES (`LoyaltyService`) | ❌ NO |
| Event history | ✅ YES (`loyalty_events`) | ❌ NO |
| Audit trail | ✅ YES (implicit via events) | ❌ NO |

**Concluzie:** Clearance level este **complet static** - se modifică DOAR manual prin DB sau admin UI (dacă există endpoint).

---

## Implementare Actuală

### Unde Apare Clearance Level?

**1. API Response (`/api/users/me`):**

```typescript
// user.routes.ts:195
{
  user: {
    clearanceLevel: user.clearanceLevel || 1
  }
}
```

**2. Database Default:**

```sql
-- Toți userii noi primesc clearanceLevel = 1
DEFAULT 1
```

**3. Demo Data:**

```sql
-- Seeding SQL setează unii useri la level 2:
UPDATE users SET clearance_level = 2 WHERE ...
```

**Utilizare:** Doar **afișare read-only** în API, fără logică business activă.

---

## Recomandări pentru Viitor (OPȚIONAL)

### Dacă Vrei Sistem Automat Clearance Level

#### 1. **Creare Tabelă Config**

```sql
CREATE TABLE clearance_level_config (
  level INT PRIMARY KEY,
  required_streak INT,
  required_loyalty INT,
  required_tier ENUM('ENTRY', 'INVESTOR', 'PRO', 'WHALE'),
  required_investment DECIMAL(15,2),
  created_at DATETIME DEFAULT NOW(),
  updated_at DATETIME DEFAULT NOW() ON UPDATE NOW()
);

-- Seed praguri
INSERT INTO clearance_level_config VALUES
(1, 0, 0, 'ENTRY', 0),        -- Default
(2, 7, 50, 'INVESTOR', 500),  -- Basic investor
(3, 30, 200, 'PRO', 2000),    -- Advanced
(4, 90, 500, 'PRO', 5000),    -- Expert
(5, 365, 1000, 'WHALE', 10000); -- Elite
```

#### 2. **Service Layer**

```typescript
// clearance.service.ts
export class ClearanceService {
  async calculateClearanceLevel(user: User): Promise<number> {
    const configs = await prisma.clearanceLevelConfig.findMany({
      orderBy: { level: 'desc' }
    });
    
    for (const config of configs) {
      if (
        user.streakDays >= config.requiredStreak &&
        user.loyaltyPoints >= config.requiredLoyalty &&
        // ... check tier, investment
      ) {
        return config.level;
      }
    }
    
    return 1; // Default
  }
  
  async updateUserClearance(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }});
    const newLevel = await this.calculateClearanceLevel(user);
    
    if (newLevel !== user.clearanceLevel) {
      await prisma.user.update({
        where: { id: userId },
        data: { clearanceLevel: newLevel }
      });
      
      // Audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'CLEARANCE_LEVEL_UPDATE',
          metadata: JSON.stringify({ 
            oldLevel: user.clearanceLevel, 
            newLevel 
          })
        }
      });
    }
  }
}
```

#### 3. **Trigger Auto-Recalculare**

```typescript
// În check-in service, după award loyalty points:
await clearanceService.updateUserClearance(userId);

// În tier promotion:
await clearanceService.updateUserClearance(userId);
```

#### 4. **API Endpoints**

```typescript
// GET /admin/clearance/config - list config
// PATCH /admin/clearance/config/:level - update thresholds
// POST /admin/users/:id/clearance/recalculate - force recalc
```

---

## Concluzie Finală

### Starea Actuală (Production)

| Aspect | Status | Detalii |
|--------|--------|---------|
| **① Sursă date** | ✅ Câmp DB | `users.clearance_level INT` |
| **② Config praguri** | ❌ NU există | Valoare fixă/manuală |
| **③ Auto-recalculare** | ❌ NU există | Manual update only |
| **③ Auditabil** | ❌ NU există | Fără istoric modificări |

### Pentru Producție ACUM

✅ **Clearance level funcționează** ca **câmp static** (similar cu un "badge manual")

- Admin setează manual în DB
- Se afișează în API/UI
- NU se schimbă automat

### Pentru Viitor (OPȚIONAL)

🔧 Dacă vrei sistem automat:

1. Crează tabelă `clearance_level_config` cu praguri
2. Implementează `ClearanceService` cu logică calcul
3. Trigger recalculare la check-in / tier change / milestone
4. Adaugă audit logging pentru transparență

**RISC TEHNIC:** ZERO - clearance level actual este read-only, nu afectează nicio logică business critică.
