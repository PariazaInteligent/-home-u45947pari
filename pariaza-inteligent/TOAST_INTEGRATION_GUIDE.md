# 🎊 Toast Integration Guide - Pariaza Inteligent Platform

**Version**: 1.0  
**Last Updated**: 2026-01-08  
**Owner**: Development Team

---

## 📖 Overview

Platforma folosește **ToastManager** pentru notificări vizuale globale, complet integrat cu **SoundManager** pentru feedback vizual + auditiv premium, inspirat de experiența Duolingo.

---

## 🎯 Available Toast Types

| Type | Visual | Icon | Sound | When to Use |
|------|--------|------|-------|-------------|
| `success` | Verde #58CC02 | ✓ CheckCircle2 | success.mp3 | Actions completed successfully |
| `error` | Roșu #FF4B4B | ✗ XCircle | error.mp3 | Errors, failures, validation issues |
| `info` | Blue #1CB0F6 | ℹ Info | notification.mp3 | Neutral information, tips |
| `achievement` | Purple gradient + shimmer | ⭐ Sparkles | achievement.mp3 | Major milestones! |

---

## 🚀 Quick Start

### 1. Import ToastManager

```typescript
import { ToastManager } from '../utils/ToastManager';
```

### 2. Show Toast

```typescript
// Toast only (visual)
ToastManager.show('success', 'Settings saved!');

// Toast + Sound (recommended!)
ToastManager.showWithSound('success', 'Login successful!');
```

### 3. Done

That's it! No setup, no providers, no configuration needed.

---

## 📝 API Reference

### `show(type, message, duration?)`

Shows a toast notification (visual only).

**Parameters**:

- `type`: `'success' | 'error' | 'info' | 'achievement'`
- `message`: `string` - Message to display
- `duration`: `number` (optional) - Duration in ms (default: 3000)

**Returns**: `string` - Toast ID (for manual removal)

**Example**:

```typescript
ToastManager.show('success', 'Profile updated!');
ToastManager.show('error', 'Failed to connect', 5000);
```

---

### `showWithSound(type, message, duration?)`

Shows toast + plays corresponding sound.

**Parameters**: Same as `show()`

**Sound Mapping**:

- `success` → `success.mp3`
- `error` → `error.mp3`
- `info` → `notification.mp3`
- `achievement` → `achievement.mp3`

**Example**:

```typescript
// ✅ Perfect combo: visual + audio feedback
ToastManager.showWithSound('success', 'Check-in reușit! +50 Puncte');
ToastManager.showWithSound('error', 'Conexiune eșuată');
```

---

### `remove(id)`

Manually remove a toast before auto-dismiss.

**Parameters**:

- `id`: `string` - Toast ID returned by `show()`

**Example**:

```typescript
const toastId = ToastManager.show('info', 'Processing...');
// Later...
ToastManager.remove(toastId);
```

---

### `clear()`

Remove ALL toasts immediately.

**Example**:

```typescript
ToastManager.clear(); // Clears all active toasts
```

---

## 🎨 Usage Patterns

### Pattern 1: Success/Error in API Calls

```typescript
const handleSubmit = async () => {
  try {
    const res = await fetch('/api/action', { ... });
    
    if (res.ok) {
      // ✅ SUCCESS
      ToastManager.showWithSound('success', 'Saved successfully!');
    } else {
      // ❌ ERROR
      ToastManager.showWithSound('error', 'Failed to save');
    }
  } catch (err) {
    // ❌ ERROR
    ToastManager.showWithSound('error', 'Network error');
  }
};
```

---

### Pattern 2: Achievement (Major Milestones)

```typescript
// Registration complete - use ACHIEVEMENT!
ToastManager.showWithSound('achievement', '🎉 Account created!');

// Level up
ToastManager.showWithSound('achievement', '⭐ Upgraded to Gold tier!');

// 100 day streak
ToastManager.showWithSound('achievement', '🔥 100 days streak!');
```

---

### Pattern 3: Info Messages

```typescript
// Neutral information
ToastManager.showWithSound('info', 'New update available');
ToastManager.showWithSound('info', 'Check your email');
```

---

### Pattern 4: Quick Feedback (no sound)

```typescript
// Sometimes you just want visual feedback
ToastManager.show('success', 'ID copied!');
```

---

## 📊 Decision Guide

**When to use what**:

| Scenario | Toast Type | Use Sound? |
|----------|-----------|------------|
| Login successful | `success` | ✅ YES |
| Deposit approved | `success` | ✅ YES |
| Settings saved | `success` | ✅ YES |
| Registration complete | `achievement` | ✅ YES (special!) |
| Tier upgrade | `achievement` | ✅ YES |
| Validation error | `error` | ✅ YES |
| API failure | `error` | ✅ YES |
| Copy to clipboard | `success` | Optional |
| Info message | `info` | ✅ YES |
| Payment deleted | `info` | ✅ YES |

**Rule of thumb**: Use `showWithSound()` for ALL important actions. It provides complete feedback!

---

## ✅ Best Practices

### DO's

✅ Use `showWithSound()` for important actions (login, deposit, errors)  
✅ Use `success` for completed actions  
✅ Use `achievement` for major milestones  
✅ Keep messages concise (max 60 characters)  
✅ Use emojis for personality (🎉, ⭐, ✓)  

### DON'Ts

❌ Don't spam toasts (max 3 visible at once - auto-managed)  
❌ Don't use long messages (will be cut off)  
❌ Don't usegeneric messages ("Success", "Error" → be specific!)  
❌ Don't forget sounds for important actions  

---

## 🎯 Examples from Platform

### ProfilePage.tsx

```typescript
// Check-in successful
ToastManager.showWithSound('success', `Check-in reușit! +${points} Puncte`);

// Already checked in
ToastManager.showWithSound('info', 'Deja verificat azi!');

// Copy ID
ToastManager.showWithSound('success', 'ID copiat în clipboard!');

// Error
ToastManager.showWithSound('error', 'Eroare la salvare');
```

### LoginPage.tsx (Future)

```typescript
// Login success
ToastManager.showWithSound('success', 'Bine ai revenit!');

// Login error
ToastManager.showWithSound('error', 'Email sau parolă incorectă');
```

### RegisterPage.tsx (Future)

```typescript
// Registration complete - ACHIEVEMENT!
ToastManager.showWithSound('achievement', '🎉 Cont creat cu succes!');
```

---

## 🔄 Before vs After

### Before (ProfilePage.tsx)

```typescript
// Local state
const [toast, setToast] = useState<{message, type} | null>(null);

// Auto-dismiss logic
useEffect(() => {
  if (toast) {
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }
}, [toast]);

// Usage
setToast({ message: 'Check-in reușit!', type: 'success' });
SoundManager.play('success'); // Separate call

// UI rendering
{toast && (
  <div className="fixed bottom-6 ...">
    {toast.message}
  </div>
)}
```

### After (ProfilePage.tsx)

```typescript
// Import
import { ToastManager } from '../utils/ToastManager';

// Usage (one line!)
ToastManager.showWithSound('success', 'Check-in reușit!');

// UI rendering
// Nothing! ToastContainer is global in App.tsx
```

**Result**:

- ❌ -20 lines of code
- ✅ +Toast + Sound in ONE LINE
- ✅ +Global consistency
- ✅ +No duplication

---

## 🛠️ Troubleshooting

### Toasts not showing?

1. **Check ToastContainer** - is it mounted in App.tsx?

   ```typescript
   // App.tsx
   return (
     <BrowserRouter>
       ...
       <ToastContainer /> {/* Must be here! */}
     </BrowserRouter>
   );
   ```

2. **Check console** - any errors?

   ```
   [ToastManager] 📢 Showing success: "Message"
   ```

3. **Check z-index** - is something covering toasts?
   - ToastContainer has `z-50`

### Sounds not playing?

- Sounds are managed by `SoundManager`
- Check if user has "Sunete Interfață" enabled in `/profile`
- See `SOUND_INTEGRATION_GUIDE.md` for sound troubleshooting

---

## 📁 Files

### Core

- `utils/ToastManager.ts` - Singleton manager
- `components/ui/ToastContainer.tsx` - UI component

### Usage Examples

- `components/ProfilePage.tsx` - Fully integrated
- `components/LoginPage.tsx` - (Future integration)
- `components/RegisterPage.tsx` - (Future integration)

---

## 🎓 For New Developers

### Step 1: Understand the System

1. Read this guide
2. Check `ProfilePage.tsx` for real examples
3. Test toasts by toggling settings in `/profile`

### Step 2: Integrate in Your Feature

```typescript
// 1. Import
import { ToastManager } from '../utils/ToastManager';

// 2. Use
ToastManager.showWithSound('success', 'Action completed!');

// 3. Done!
```

### Step 3: Choose the Right Type

- Success → action completed
- Error → something failed
- Info → neutral message
- Achievement → MAJOR milestone

---

## 🔗 Related Documentation

- `SOUND_INTEGRATION_GUIDE.md` - Sound system guide
- `plan_toast_manager.md` - Implementation plan
- `_ai/implementare_sunete_rezumat.md` - Sound system summary

---

**Questions?** Consultă exemplele din `ProfilePage.tsx` sau ghidul de sunete!

**Last Updated**: 2026-01-08  
**Status**: ✅ Production Ready - Fully Implemented
