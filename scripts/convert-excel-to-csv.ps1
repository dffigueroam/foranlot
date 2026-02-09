param(
    [string]$ExcelPath = "c:\Users\figue\Dropbox\numeros y pronosticos\Historico_page.xlsx"
)

$csvPath = "c:\ForanLot\temp-lottery-results.csv"

if (-not (Test-Path "c:\ForanLot\temp")) {
    New-Item -ItemType Directory -Path "c:\ForanLot\temp" -Force | Out-Null
}

Write-Host "Leyendo Excel: $ExcelPath" -ForegroundColor Cyan

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$workbook = $excel.Workbooks.Open($ExcelPath)
$worksheet = $workbook.Sheets.Item(1)

$UsedRange = $worksheet.UsedRange
$rows = $UsedRange.Rows.Count
$cols = $UsedRange.Columns.Count

Write-Host "Encontradas $rows filas y $cols columnas" -ForegroundColor Yellow

$csvContent = @()

$headers = @()
for ($col = 1; $col -le $cols; $col++) {
    $header = $worksheet.Cells(1, $col).Value2
    $headers += $header
}

# Incluir hasta la columna 6 (draw_date) si existe; si no, usar todas las columnas disponibles
$filteredHeaders = if ($cols -ge 6) { $headers[0..5] } else { $headers }
$csvContent += ($filteredHeaders -join ";")

for ($row = 2; $row -le $rows; $row++) {
    $rowData = @()
    $maxCol = [math]::Min(6, $cols)
    for ($col = 1; $col -le $maxCol; $col++) {
        $cellValue = $worksheet.Cells($row, $col).Value2
        if ($null -eq $cellValue) {
            $cellValue = ""
        }
        $cellValue = [string]$cellValue
        if ($cellValue -like "*;*") {
            $cellValue = "`"$cellValue`""
        }
        $rowData += $cellValue
    }
    $csvContent += ($rowData -join ";")
}

$csvContent | Out-File -FilePath $csvPath -Encoding UTF8
Write-Host "CSV creado: $csvPath" -ForegroundColor Green

$workbook.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
[GC]::Collect()

Write-Host "`nPrimeras lineas del CSV:" -ForegroundColor Cyan
Get-Content $csvPath | Select-Object -First 10

Write-Host "`nProceso completado" -ForegroundColor Green
