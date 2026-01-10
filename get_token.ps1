$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@pariazainteligent.ro","password":"password123"}'
$response.accessToken | Set-Content -Path "token_full.txt" -Encoding ascii
Write-Host "✅ Token saved to token_full.txt"
