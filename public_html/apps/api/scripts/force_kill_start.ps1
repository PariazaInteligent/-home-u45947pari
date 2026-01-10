Write-Host "Ensuring Port 3001 is free..."
$maxRetries = 5
$retry = 0

while ($retry -lt $maxRetries) {
    $socket = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
    if ($socket) {
        $procId = $socket.OwningProcess
        Write-Host "Found listener on 3001 (PID $procId). Killing..."
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 5
        $retry++
    }
    else {
        Write-Host "Port 3001 is free."
        break
    }
}

if ($retry -eq $maxRetries) {
    Write-Host "Failed to clear port 3001."
    exit 1
}

Write-Host "Starting tsx src/index.ts (No Watch)..."
Set-Location "$PSScriptRoot/.."
npx tsx src/index.ts
