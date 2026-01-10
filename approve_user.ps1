$userId = "cmjg9qt7f0000enl9gq2lbp6b"

# Try logging in with various admin credentials
$creds = @(
    @{email="admin@pariazainteligent.ro"; password="Admin123!"},
    @{email="admin@pariaza.ro"; password="password"},
    @{email="admin@example.com"; password="admin123"}
)

$token = $null
foreach ($cred in $creds) {
    try {
        $body = $cred | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -ContentType "application/json" -Body $body -ErrorAction Stop
        $token = $response.accessToken
        Write-Host "✅ Logged in with $($cred.email)"
        break
    } catch {
        Write-Host "❌ Failed: $($cred.email)"
    }
}

if (-not $token) {
    Write-Host "❌ All login attempts failed"
    exit 1
}

# Approve user
$approveUrl = "http://localhost:3001/admin/users/$userId/approve"
$headers = @{"Authorization" = "Bearer $token"}
$approveResponse = Invoke-RestMethod -Uri $approveUrl -Method POST -Headers $headers
Write-Host "✅ User approved"
$approveResponse | ConvertTo-Json
