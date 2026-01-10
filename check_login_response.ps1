try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"admin@pariazainteligent.ro","password":"password123"}'
    Write-Host "RESPONSE_START"
    $response | ConvertTo-Json
    Write-Host "RESPONSE_END"
}
catch {
    Write-Host "ERROR: $($_.toString())"
}
