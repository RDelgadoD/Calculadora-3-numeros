# Script para limpiar archivos eliminados del índice de Git
# Ejecutar desde el directorio del proyecto

Write-Host "=== Limpiando archivos eliminados de Git ===" -ForegroundColor Cyan

$missingFiles = git ls-files | Where-Object { -not (Test-Path $_) }

if ($missingFiles) {
    Write-Host "`nEncontrados $($missingFiles.Count) archivos que no existen físicamente:" -ForegroundColor Yellow
    $missingFiles | ForEach-Object { Write-Host "  - $_" }
    
    Write-Host "`nEliminando del índice de Git..." -ForegroundColor Yellow
    $missingFiles | ForEach-Object {
        git rm --cached $_ 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $_" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $_ (puede que no esté en Git)" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n=== Limpieza completada ===" -ForegroundColor Green
    Write-Host "`nPara ver los cambios, ejecuta: git status" -ForegroundColor Cyan
} else {
    Write-Host "✅ No hay archivos faltantes para eliminar." -ForegroundColor Green
}

