$adminEmail = "admin@pariazainteligent.ro"
$adminPass = "password123"
$pendingUserId = "cmjg9qt7f0000enl9gq2lbp6b"

Write-Host "🔹 1. Logging in..."
$loginBody = @{ email = $adminEmail; password = $adminPass } | ConvertTo-Json
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -ErrorAction Stop
    $token = $loginResponse.accessToken
    $token | Out-File -FilePath "token.txt" -Encoding ascii
    Write-Host "✅ Login OK. Token saved to token.txt"
}
catch {
    Write-Host "❌ Login Failed."
    exit 1
}

Write-Host "🔹 2. Approving User..."
$headers = @{ "Authorization" = "Bearer $token" }
try {
    # Using explicit content type and empty json body
    $approveResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/$pendingUserId/approve" -Method POST -Headers $headers -ContentType "application/json" -Body "{}" -ErrorAction Stop
    Write-Host "✅ Approved!"
    $approveResponse | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "❌ Approval Failed: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Response Body: $($reader.ReadToEnd())"
    }
    exit 1
}
