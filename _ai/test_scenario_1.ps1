# Scenario 1 Test Script
Write-Output '=== SCENARIO 1: Manual Snapshot + Check-In ==='
$loginBody = @{ email = 'admin@pariazainteligent.ro'; password = 'password123' } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri 'http://localhost:3001/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
$token = $loginResponse.accessToken
Write-Output '[1] Login successful!'
$headers = @{ Authorization = 'Bearer ' + $token }
$snapshot = Invoke-RestMethod -Uri 'http://localhost:3001/admin/snapshot/trigger' -Method POST -Headers $headers
Write-Output '[2] Snapshot: profitFlag=' + $snapshot.snapshot.profitFlag + ', fundValue=' + $snapshot.snapshot.totalFundValue
$checkin = Invoke-RestMethod -Uri 'http://localhost:3001/api/users/profile/checkin' -Method POST -Headers $headers
Write-Output '[3] Check-in: streak=' + $checkin.streakDays + ', points=' + $checkin.loyaltyPoints + ', awarded=' + $checkin.pointsAwarded
$me = Invoke-RestMethod -Uri 'http://localhost:3001/api/users/me' -Method GET -Headers $headers
Write-Output '[4] Profile: loyalty total=' + $me.loyalty.total + ', breakdown count=' + $me.loyalty.breakdown.Count
$me.loyalty.breakdown | ForEach-Object { Write-Output ('  - ' + $_.ruleName + ': ' + $_.totalPoints + ' pts x' + $_.occurrences) }
Write-Output '=== COMPLETE ==='
