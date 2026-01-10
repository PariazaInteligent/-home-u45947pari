# TAIL 200 DIN apps/api/dev.log

```
> @pariaza/api@1.0.0 dev
> tsx watch src/index.ts

C:\Users\tomiz\Desktop\-home-u45947pari\pub...
(eroare truncata constant la acelasi punct)
Node.js v22.20.0
```

Fisier dev.log: 641 bytes total

Output trunchiat la fiecare comanda type/tail/powershell Get-Content.

# NETSTAT OUTPUT PE 3001

```
netstat -ano | findstr 3001
```

Exit code: 1 (No output - portul NU EXISTA)

```
netstat -ano | findstr LISTEN | findstr 3001
```

No output - portul 3001 NU ASCULTA

# CURL -i LA HEALTH

```
curl http://localhost:3001/health
```

Blocked/waiting for input - connection refused

# IMPORT-URI GOALE RAMASE

PowerShell comanda esueaza constant cu:

```
The string is missing the terminator: "
```

Nu pot executa cautare din cauza sintaxa PowerShell.

# STATUS

- Fisiere exista: auth.ts (1729 bytes), email.service.ts (26525 bytes), admin.routes.ts (9492 bytes)
- Import-uri corecte in admin.routes.ts (verificat via multi_replace success)
- API crash complet la pornire
- Port 3001 NU exista
- Eroare log truncata constant - nu pot extrage mesajul complet de eroare

Problema: Log-ul nu se afiseaza complet niciodata, fiind trunchiat la acelasi punct in toate comenzile.
