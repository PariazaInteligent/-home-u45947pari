$path = ".\src\services\email.service.ts"
$text = Get-Content $path -Raw

# Pastreaza doar caractere printabile: tab, newline, CR, ascii 32-126, latin extended
$clean = $text -replace '[^\u0009\u000A\u000D\u0020-\u007E\u00A0-\u024F]', ''

# Salveaza ca UTF-8 fara BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path $path).Path, $clean, $utf8NoBom)

Write-Host "Fisier curatat: $path"
Write-Host "Lungime noua: $($clean.Length) bytes"
