# Fix all empty imports in TypeScript files

$files = Get-ChildItem -Recurse -Path "apps\api\src" -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    if ($content -match "from '';") {
        $fixed = $content -replace "from '';", "from '@pariaza/database';"
        
        # Save with UTF-8 no BOM
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($file.FullName, $fixed, $utf8NoBom)
        
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "Done fixing $($files.Count) files"
