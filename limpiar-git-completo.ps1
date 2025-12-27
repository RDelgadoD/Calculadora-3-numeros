# Script completo para limpiar archivos eliminados de Git
# Ejecutar desde el directorio del proyecto

$ErrorActionPreference = "Continue"
$logFile = "limpieza_git.log"

function Write-Log {
    param($message, $color = "White")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $message"
    Write-Host $logMessage -ForegroundColor $color
    Add-Content -Path $logFile -Value $logMessage
}

Write-Log "=== INICIANDO LIMPIEZA COMPLETA DE GIT ===" "Cyan"

# Paso 1: Obtener lista de archivos rastreados
Write-Log "Paso 1: Obteniendo lista de archivos rastreados por Git..." "Yellow"
$allFiles = git ls-files
Write-Log "Total de archivos rastreados: $($allFiles.Count)" "Green"

# Paso 2: Identificar archivos faltantes
Write-Log "`nPaso 2: Identificando archivos que NO existen físicamente..." "Yellow"
$missingFiles = @()
foreach ($file in $allFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
        Write-Log "  ❌ Falta: $file" "Red"
    }
}

Write-Log "`nTotal de archivos faltantes: $($missingFiles.Count)" "Yellow"

if ($missingFiles.Count -eq 0) {
    Write-Log "✅ No hay archivos faltantes. Git está limpio." "Green"
    exit 0
}

# Paso 3: Eliminar archivos del índice
Write-Log "`nPaso 3: Eliminando archivos del índice de Git..." "Yellow"
$removed = 0
$failed = 0

foreach ($file in $missingFiles) {
    try {
        $result = git rm --cached $file 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "  ✅ Eliminado: $file" "Green"
            $removed++
        } else {
            Write-Log "  ⚠️  No se pudo eliminar: $file (puede que no esté en Git)" "Yellow"
            $failed++
        }
    } catch {
        Write-Log "  ❌ Error al eliminar: $file - $_" "Red"
        $failed++
    }
}

Write-Log "`nArchivos eliminados exitosamente: $removed" "Green"
if ($failed -gt 0) {
    Write-Log "Archivos que no se pudieron eliminar: $failed" "Yellow"
}

# Paso 4: Verificar estado
Write-Log "`nPaso 4: Verificando estado de Git..." "Yellow"
$status = git status --short
if ($status) {
    Write-Log "Cambios pendientes:" "Yellow"
    $status | ForEach-Object { Write-Log "  $_" "Gray" }
} else {
    Write-Log "No hay cambios pendientes" "Green"
}

# Paso 5: Hacer commit
$deletedFiles = git status --short | Select-String "^D "
if ($deletedFiles) {
    Write-Log "`nPaso 5: Haciendo commit de los cambios..." "Yellow"
    try {
        git add -A
        git commit -m "Limpiar: Eliminar archivos que ya no existen en el proyecto ($removed archivos)" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✅ Commit realizado exitosamente" "Green"
        } else {
            Write-Log "⚠️  No se pudo hacer commit (puede que no haya cambios nuevos)" "Yellow"
        }
    } catch {
        Write-Log "❌ Error al hacer commit: $_" "Red"
    }
} else {
    Write-Log "No hay archivos eliminados para commitear (puede que ya estén commiteados)" "Yellow"
}

# Paso 6: Verificación final
Write-Log "`nPaso 6: Verificación final..." "Yellow"
$remaining = git ls-files | Where-Object { -not (Test-Path $_) }
if ($remaining) {
    Write-Log "⚠️  Aún quedan $($remaining.Count) archivos faltantes:" "Yellow"
    $remaining | ForEach-Object { Write-Log "  - $_" "Gray" }
} else {
    Write-Log "✅ No quedan archivos faltantes. Git está completamente limpio." "Green"
}

Write-Log "`n=== LIMPIEZA COMPLETADA ===" "Cyan"
Write-Log "Log guardado en: $logFile" "Gray"

