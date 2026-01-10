$envPath = "$PSScriptRoot/../.env.local"
Write-Host "Checking $envPath..."

# 1. Check ENCRYPTION_KEY
if (Test-Path $envPath) {
    if (!(Select-String -Path $envPath -Pattern "ENCRYPTION_KEY" -Quiet)) {
        Write-Host "Adding ENCRYPTION_KEY to .env.local..."
        Add-Content $envPath "`nENCRYPTION_KEY=7f8a9d0s8f7a6d5f4s3a2d1f0s9a8d7f"
    } else {
        Write-Host "ENCRYPTION_KEY already exists."
    }
} else {
    Write-Host ".env.local not found! Creating..."
    Set-Content $envPath "ENCRYPTION_KEY=7f8a9d0s8f7a6d5f4s3a2d1f0s9a8d7f"
}

# 2. Kill Port 3001
$socket = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($socket) {
    $procId = $socket.OwningProcess
    Write-Host "Found process $procId listening on 3001. Killing..."
    Stop-Process -Id $procId -Force
    Write-Host "Process killed."
} else {
    Write-Host "No process found on port 3001."
}
