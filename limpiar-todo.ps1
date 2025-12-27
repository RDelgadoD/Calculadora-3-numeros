# Script para eliminar TODOS los archivos faltantes de Git de una vez
$ErrorActionPreference = "Continue"

Write-Host "=== LIMPIEZA COMPLETA DE GIT ===" -ForegroundColor Cyan

cd "C:\Users\ronha\OneDrive\Documentos\ProyectosCursor\MiPrimerProyecto"

# Paso 1: Encontrar TODOS los archivos faltantes
Write-Host "`nPaso 1: Buscando archivos faltantes..." -ForegroundColor Yellow
$allTrackedFiles = git ls-files
$missingFiles = @()

foreach ($file in $allTrackedFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
        Write-Host "  ❌ Falta: $file" -ForegroundColor Red
    }
}

if ($missingFiles.Count -eq 0) {
    Write-Host "✅ No hay archivos faltantes. Git está limpio." -ForegroundColor Green
    exit 0
}

Write-Host "`nEncontrados $($missingFiles.Count) archivos faltantes" -ForegroundColor Yellow

# Paso 2: Eliminar todos del índice
Write-Host "`nPaso 2: Eliminando del índice de Git..." -ForegroundColor Yellow
$removed = 0
$failed = 0

foreach ($file in $missingFiles) {
    $result = git rm --cached $file 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Eliminado: $file" -ForegroundColor Green
        $removed++
    } else {
        Write-Host "  ⚠️  No eliminado: $file" -ForegroundColor Yellow
        $failed++
    }
}

Write-Host "`nEliminados: $removed | Fallidos: $failed" -ForegroundColor Cyan

# Paso 3: Commit
Write-Host "`nPaso 3: Haciendo commit..." -ForegroundColor Yellow
git add -A
$commitResult = git commit -m "Limpiar: Eliminar todos los archivos faltantes del proyecto ($removed archivos)" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit realizado exitosamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  $commitResult" -ForegroundColor Yellow
}

# Paso 4: Verificación final
Write-Host "`nPaso 4: Verificación final..." -ForegroundColor Yellow
$remaining = git ls-files | Where-Object { -not (Test-Path $_) }
if ($remaining) {
    Write-Host "⚠️  Aún quedan $($remaining.Count) archivos faltantes:" -ForegroundColor Red
    $remaining | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
} else {
    Write-Host "✅ Git está completamente limpio. No hay archivos faltantes." -ForegroundColor Green
}

Write-Host "`n=== LIMPIEZA COMPLETADA ===" -ForegroundColor Cyan

