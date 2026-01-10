@echo off
echo ========================================
echo  Pornire Pariaza Inteligent
echo ========================================
echo.

REM Disable Husky hooks on automated installs
set HUSKY=0
set npm_config_ignore_scripts=true

REM Oprire procese vechi pe porturile 3000, 3001, 3002
echo Oprire procese vechi...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

timeout /t 2 >nul

REM Verificare și instalare dependențe API
echo Verific dependențe API...
cd /d C:\Users\tomiz\Desktop\-home-u45947pari\public_html\apps\api

if not exist node_modules (
    echo Instalez dependențe API...
    call npm install
    timeout /t 3 >nul
)

REM Hard check: pachetele critice TREBUIE să existe
if not exist node_modules\@fastify\static (
    echo LIPSESTE @fastify/static! Rulez install complet...
    call npm install
    timeout /t 3 >nul
)

if not exist node_modules\@fastify\multipart (
    echo LIPSESTE @fastify/multipart! Rulez install complet...
    call npm install
    timeout /t 3 >nul
)

REM Verificare dependențe Frontend
echo Verific dependențe Frontend...
cd /d C:\Users\tomiz\Desktop\-home-u45947pari\pariaza-inteligent
if not exist node_modules (
    echo Instalez dependențe Frontend...
    call npm install
    timeout /t 3 >nul
) else (
    echo Dependențe Frontend OK!
)

REM Seed admin investor data (DEV ONLY)
if "%SEED_DEV%"=="1" (
    echo.
    echo Rulez seed admin investor data...
    cd /d C:\Users\tomiz\Desktop\-home-u45947pari
    node public_html\apps\api\scripts\seed_admin_investor.mjs
    echo.
)

REM Pornire API Backend
echo Pornire API Backend (port 3001)...
start "Pariaza API" cmd /k "cd /d C:\Users\tomiz\Desktop\-home-u45947pari\public_html\apps\api && npm run dev"

REM Așteptare și verificare dacă API pornește
echo Verific dacă API răspunde...
timeout /t 8 >nul

REM Ping la /health endpoint
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo.
    echo ========================================
    echo  EROARE: API NU PORNESTE!
    echo  Verifică terminalul API pentru detalii.
    echo ========================================
    echo.
    pause
    exit /b 1
) else (
    echo API OK! Pornesc frontend...
)

REM Pornire Frontend Duolingo
echo Pornire Frontend Duolingo (port 3000)...
start "Pariaza Frontend" cmd /k "cd /d C:\Users\tomiz\Desktop\-home-u45947pari\pariaza-inteligent && npm run dev"

timeout /t 6 >nul

REM Deschidere browser
echo Deschidere browser...
start http://localhost:3000

echo.
echo ========================================
echo  Platforma pornita cu succes!
echo  API: http://localhost:3001
echo  Frontend: http://localhost:3000
echo ========================================
echo.
pause
