$adminEmail = "admin@pariazainteligent.ro"
$adminPass = "password123"
$pendingUserId = "cmjg9qt7f0000enl9gq2lbp6b"

Write-Host "🔹 1. Logging in as Admin ($adminEmail)..."
$loginBody = @{
    email    = $adminEmail
    password = $adminPass
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -ContentType "application/json" -Body $loginBody -ErrorAction Stop
    $token = $loginResponse.accessToken
    Write-Host "✅ Login Successful. Token received."
}
catch {
    Write-Host "❌ Login Failed."
    Write-Host $_.Exception.Response.GetResponseStream()
    exit 1
}

Write-Host "🔹 2. Approving Pending User ($pendingUserId)..."
$headers = @{
    "Authorization" = "Bearer $token"
}

try {
    $approveUrl = "http://localhost:3001/admin/users/$pendingUserId/approve"
    $approveResponse = Invoke-RestMethod -Uri $approveUrl -Method POST -Headers $headers -ErrorAction Stop
    Write-Host "✅ User Approved Successfully."
    Write-Host "Response:"
    $approveResponse | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "❌ Approval Failed."
    Write-Host $_
    exit 1
}
