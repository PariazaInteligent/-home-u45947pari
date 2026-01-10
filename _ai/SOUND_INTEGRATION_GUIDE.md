# 🎵 Sound Integration Guide - Pariaza Inteligent Platform

**Version**: 1.0  
**Last Updated**: 2026-01-08  
**Owner**: Development Team

---

## 📖 Overview

Această platformă folosește **SoundManager** pentru feedback sonor global, inspirat de experiența Duolingo. Sistemul oferă 8 tipuri de sunete care trebuie integrate consistent în toate funcțiile platformei.

---

## 🎯 Available Sounds

| Sound Name | Purpose | When to Use | Duration | Example |
|-----------|---------|-------------|----------|---------|
| `success` | General success | Login, deposit approved, settings saved | 0.5-1s | Submit form successful |
| `achievement` | Major milestone | Registration complete, tier upgrade, 100-day streak | 1-1.5s | Account verified |
| `checkin` | Daily task completed | Daily check-in, daily report verification | 0.3-0.5s | Check-in button click |
| `click` | Interactive feedback | Toggle ON, percentage buttons, copy ID | 0.1-0.3s | Toggle switch |
| `error` | Error occurred | Validation fails, API errors, insufficient balance | 0.3-0.5s | Form submission failed |
| `notification` | Information | New message, update available, non-critical alert | 0.3-0.7s | Payment method deleted |
| `whoosh` | Transition | Page navigation, modal open/close, step changes | 0.3-0.6s | Registration step change |
| `coins` | Reward/Points | Loyalty points received, bonus unlocked | 0.4-0.8s | +50 Loyalty Points |

---

## 🚀 Quick Start

### 1. Import SoundManager

```typescript
import { SoundManager } from '../utils/SoundManager';
// or
import { SoundManager } from '../../utils/SoundManager'; // if nested deeper
```

### 2. Play a Sound

```typescript
SoundManager.play('success'); // That's it!
```

**Note**: Nu trebuie să verifici dacă sunetele sunt activate - `SoundManager` se ocupă automat de preferințele utilizatorului.

---

## 📝 Integration Patterns

### Pattern 1: Success/Error în API Calls

```typescript
const handleSubmit = async () => {
  try {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (response.ok) {
      // ✅ SUCCESS SOUND
      SoundManager.play('success');
      // Your success logic...
    } else {
      // ❌ ERROR SOUND
      SoundManager.play('error');
      // Your error logic...
    }
  } catch (err) {
    // ❌ ERROR SOUND
    SoundManager.play('error');
    console.error(err);
  }
};
```

### Pattern 2: Immediate Feedback pe Click

```typescript
const handlePercentageClick = (percent: number) => {
  // 🎵 CLICK SOUND (immediate feedback)
  SoundManager.play('click');
  
  // Rest of the logic...
  const value = (balance * percent) / 100;
  setAmount(value);
};
```

### Pattern 3: Achievement Unlocked

```typescript
const completeRegistration = async () => {
  // ... registration logic ...
  
  if (success) {
    // 🎵 ACHIEVEMENT SOUND (major milestone!)
    SoundManager.play('achievement');
    
    // Optional: Play coins sound after confetti
    setTimeout(() => {
      SoundManager.play('coins');
    }, 300);
  }
};
```

### Pattern 4: Tranziții UI

```typescript
const navigateToNextStep = () => {
  // 🎵 WHOOSH SOUND (smooth transition)
  SoundManager.play('whoosh');
  
  setCurrentStep(currentStep + 1);
};
```

---

## ✅ Integration Checklist

Pentru fiecare funcție nouă, asigură-te că:

- [ ] **Importezi** SoundManager la început
- [ ] **Adaugi sunet pentru SUCCESS** (dacă există flux de succes)
- [ ] **Adaugi sunet pentru ERROR** (dacă există flux de eroare)
- [ ] **Folosești sunetul corect** conform tabelului de mai sus
- [ ] **Testezi** toggle-ul "Sunete Interfață" în `/profile` pentru a confirma

---

## 🎨 Best Practices

### ✅ DO's

1. **Consistent Sound Usage**: Folosește același sunet pentru acțiuni similare

   ```typescript
   // ✅ GOOD: All logins use 'success'
   SoundManager.play('success'); // Login successful
   SoundManager.play('success'); // Password reset successful
   ```

2. **Immediate Playback**: Apelează `play()` imediat după acțiune

   ```typescript
   // ✅ GOOD
   setSuccess(true);
   SoundManager.play('success'); // Right after success state
   ```

3. **Error Handling**: Nu uita sunetele pentru erori

   ```typescript
   // ✅ GOOD
   catch (err) {
     SoundManager.play('error');
     setError(err.message);
   }
   ```

4. **Document in Commits**: Menționează când adaugi sunete noi

   ```
   feat: Add deposit flow with success/error sounds
   ```

### ❌ DON'Ts

1. **NU folosi sunete pentru fiecare hover/scroll minor**

   ```typescript
   // ❌ BAD: Too much noise!
   onMouseEnter={() => SoundManager.play('whoosh')} // NO!
   ```

2. **NU duplica logica de enable/disable**

   ```typescript
   // ❌ BAD: SoundManager already handles this!
   if (soundsEnabled) {
     SoundManager.play('success');
   }
   
   // ✅ GOOD: SoundManager handles preferences automatically
   SoundManager.play('success');
   ```

3. **NU folosi sunete inconsistente**

   ```typescript
   // ❌ BAD: Use the same sound for similar actions
   SoundManager.play('success'); // Login
   SoundManager.play('notification'); // Another login? Confusing!
   ```

4. **NU combina prea multe sunete simultan**

   ```typescript
   // ❌ BAD: Overwhelming!
   SoundManager.play('success');
   SoundManager.play('achievement');
   SoundManager.play('coins'); // All at once = cacophony
   
   // ✅ GOOD: Stagger them
   SoundManager.play('achievement');
   setTimeout(() => SoundManager.play('coins'), 300);
   ```

---

## 🔍 Examples from Platform

### Login (LoginPage.tsx)

```typescript
// Success
setSuccess(true);
SoundManager.play('success'); // ✅

// Error
catch (err) {
  setError(err.message);
  SoundManager.play('error'); // ✅
}
```

### Register (RegisterPage.tsx)

```typescript
// Major milestone - use achievement!
setCurrentStep('success');
SoundManager.play('achievement'); // ✅

// Bonus: Add coins for confetti effect
setTimeout(() => SoundManager.play('coins'), 300);
```

### Profile Check-in (ProfilePage.tsx)

```typescript
if (data.success && !data.alreadyCheckedIn) {
  setToast({ message: 'Check-in reușit!', type: 'success' });
  SoundManager.play('success'); // ✅ (for check-in specifically, could use 'checkin')
}
```

### Withdrawal (WithdrawPage.tsx)

```typescript
// Error feedback
if (parseFloat(amount) > availableBalance) {
  SoundManager.play('error'); // ✅
  return;
}

// Success
setSuccess(true);
SoundManager.play('success'); // ✅
```

---

## 🛠️ Troubleshooting

### Sunetele nu se redau?

1. **Verifică Console** - sunt mesaje de la SoundManager?

   ```
   [SoundManager] 🎵 Initializing with sounds ENABLED ✅
   [SoundManager] 🎉 Initialization complete. Loaded 8/8 sounds.
   ```

2. **Verifică Preferințe** - utilizatorul și-a dezactivat sunetele?
   - Mergi la `/profile` → Click pe Settings (roțița) →  "Sunete Interfață"

3. **Verifică Fișierele MP3** - sunt toate în `/public/sounds/`?

   ```
   public/sounds/success.mp3
   public/sounds/achievement.mp3
   public/sounds/checkin.mp3
   public/sounds/click.mp3
   public/sounds/error.mp3
   public/sounds/notification.mp3
   public/sounds/whoosh.mp3
   public/sounds/coins.mp3
   ```

4. **Verifică Importul** - ai importat corect?

   ```typescript
   import { SoundManager } from '../utils/SoundManager'; // ✅
   ```

---

## 📚 Additional Resources

- **SoundManager Source**: `/utils/SoundManager.ts`
- **Audio Files**: `/public/sounds/`
- **Example Implementations**:
  - LoginPage.tsx
  - RegisterPage.tsx
  - ProfilePage.tsx
  - DepositPage.tsx
  - WithdrawPage.tsx

---

## 🎓 Training for New Developers

### Step 1: Understand the System

1. Read this guide
2. Check existing implementations in LoginPage.tsx or ProfilePage.tsx
3. Test the sounds by toggling "Sunete Interfață" in `/profile`

### Step 2: Identify Integration Points

For your new feature, ask:

- Is there a **success state**? → Use `success` or `achievement`
- Is there an **error state**? → Use `error`
- Is there **user interaction** (clicks)? → Use `click`
- Is there a **transition/navigation**? → Use `whoosh`
- Are **rewards given**? → Use `coins`

### Step 3: Integrate

1. Import SoundManager
2. Add `SoundManager.play('sound_name')` at the right moments
3. Test with sounds ON and OFF
4. Commit with descriptive message

---

## 📊 Sound Usage Statistics (as of 2026-01-08)

| Sound | Integrations | Components |
|-------|------------|------------|
| `success` | 6 | LoginPage, DepositPage, WithdrawPage, ProfilePage (x3) |
| `achievement` | 1 | RegisterPage |
| `checkin` | 0 | - (Reserved for future check-in flows) |
| `click` | 3 | ProfilePage (x2), WithdrawPage |
| `error` | 6 | LoginPage, RegisterPage (x2), ProfilePage (x2), WithdrawPage |
| `notification` | 0 | - (Reserved for future notification system) |
| `whoosh` | 2 | RegisterPage (x2) |
| `coins` | 1 | RegisterPage |

**Note**: Integrate `checkin` and `notification` in future features!

---

## 🤝 Contribution

When adding new sounds or modifying SoundManager:

1. Update this guide
2. Update sound usage statistics
3. Test ALL existing integrations
4. Notify team in commit message

---

**Questions?** Contact: Development Team  
**Last Reviewed**: 2026-01-08
