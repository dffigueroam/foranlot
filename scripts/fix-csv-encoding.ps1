# Script para verificar y corregir el encoding del archivo CSV de resultados
# Uso: .\fix-csv-encoding.ps1

$inputFile = Join-Path $PSScriptRoot "..\public\UltResultsApp.csv"

if (-not (Test-Path $inputFile)) {
    Write-Host "❌ Archivo no encontrado: $inputFile" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Verificando encoding de: $inputFile" -ForegroundColor Cyan

# Detectar encoding actual
$bytes = [System.IO.File]::ReadAllBytes($inputFile)
$encoding = [System.Text.Encoding]::Default

# Verificar BOM UTF-8
if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "✅ Archivo ya está en UTF-8 con BOM" -ForegroundColor Green
    exit 0
}

Write-Host "⚠️  Archivo no tiene BOM UTF-8, convirtiendo..." -ForegroundColor Yellow

# Leer contenido intentando varios encodings
try {
    $content = Get-Content $inputFile -Encoding Default -Raw
    
    # Guardar con UTF-8 BOM
    $outputFile = $inputFile + ".utf8"
    $utf8 = New-Object System.Text.UTF8Encoding $true
    [System.IO.File]::WriteAllText($outputFile, $content, $utf8)
    
    # Reemplazar archivo original
    Move-Item $outputFile $inputFile -Force
    
    Write-Host "✅ Archivo convertido a UTF-8 con BOM" -ForegroundColor Green
    Write-Host "📍 Ahora puedes ejecutar: npm run load-results" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error al convertir archivo: $_" -ForegroundColor Red
    exit 1
}
