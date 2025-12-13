# Raport Migrare v2 Demo -> v2 Real

## Rezumat
Am migrat aplicația frontend din `v2 demo` (React/TSX mock) în `v2` (Production Ready), conectând-o la o bază de date MySQL reală printr-un API PHP dedicat.

## 1. Mapare Date (Task 1)
Am analizat schema SQL curentă și am mapat entitățile din UI astfel:

| UI Component | Sursa de Date (SQL) | Observații |
|---|---|---|
| **Stats (KPIs)** |  |  |
| "Bancă Totală" | `ledger_tx` (Sum DEPOSIT - WITHDRAWAL) + `profit_distributions` (Sum PROFIT) | Calculat dinamic |
| "Profit Istoric" | `profit_distributions` (Sum all) |  |
| "Investitori" | `users` (Count WHERE role='USER') |  |
| **Transactions** | `ledger_tx` UNION `profit_distributions` |  |
| "Value Bet ..." | `profit_distributions` JOIN `bet_groups` | Label vine din `bet_groups.event` |
| "Depunere/Retragere" | `ledger_tx.kind` |  |

## 2. Backend API (Task 2)
Locație: `/v2/api/`
Fișiere create:
- `_db.php`: Conector PDO sigur (reutilizează user/pass din config).
- `global-stats.php`: Returnează JSON cu KPIs globali (`total_bank`, `historic_profit`, etc).
- `transactions.php`: Returnează lista unificată de tranzacții și pariuri (suportă paginare `limit`, `offset`).

Exemplu Răspuns `transactions.php`:
```json
{
  "ok": true,
  "data": [
    {
      "id": "bet_15",
      "type": "PROFIT",
      "label": "Romania - Italia - Romania castiga",
      "amount": "+90.00 EUR",
      "date": "22:55:32",
      "hash": "0x..."
    }
  ]
}
```

## 3. Frontend & Build (Task 3 & 4)
- **Sursa**: Copiată în `public_html/v2_src` (pentru a păstra `v2 demo` intact).
- **Modificări**:
  - Creat `lib/api.ts` pentru comunicare cu Backend.
  - Actualizat `components/Stats.tsx` să folosească `api.ts`.
  - Corectat erori de sintaxă JSX în `Support.tsx` și `RiskManagement.tsx` (unclosed `>`).
  - Configurat `vite.config.ts` cu `base: '/v2/'` și `outDir: '../v2'`.
- **Deploy**:
  - Build static generat în `/v2/`.
  - Adăugat `/v2/.htaccess` pentru rutare SPA (RewriteRule -> index.html).

## 4. Mentenanță
- **Modificare DB Config**: Editează `/v2/api/_db.php` (sau `public_html/db.php` dacă e folosit global).
- **Rebuild Frontend**:
  1. Intră în `public_html/v2_src` (via SSH/Terminal).
  2. Rulează `npm install` (dacă e prima dată).
  3. Rulează `npm run build`.
  4. Fișierele se actualizează automat în `/v2/`.
  5. **Notă**: Directorul `api` din `/v2/` este păstrat (nu se șterge la build).

## Backup
Folderul `/v2 demo/` a rămas **neatins**.
Folderul de lucru (sursă modificată) este `/v2_src/`.
Site-ul live este în `/v2/`.
