# Pastreaza primele 574 linii (fara metoda rejection)
$lines = Get-Content ".\src\services\email.service.ts" -Head 574

# Adauga inchidere clase si export
$lines += ""
$lines += "// Export singleton instance"
$lines += "export const emailService = new EmailService();"

# Scrie fisier
$lines | Out-File -Encoding UTF8 ".\src\services\email.service.clean.ts"

# Copie inapoi
Copy-Item ".\src\services\email.service.clean.ts" ".\src\services\email.service.ts" -Force

Write-Host "Fisier curatat: $(($lines | Measure-Object -Line).Lines) linii"
