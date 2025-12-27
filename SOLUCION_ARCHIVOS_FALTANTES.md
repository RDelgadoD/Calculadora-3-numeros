# Solución para Archivos Faltantes en Git

## Problema
Cuando intentas aplicar cambios del worktree a la rama principal, aparecen errores como:
```
Failed to apply worktree to current branch: Unable to read file 'insertar-cliente-syp-solutions-simple.sql'
```

## Solución Aplicada

Se ha ejecutado el siguiente comando para eliminar el archivo del índice de Git:

```powershell
cd "C:\Users\ronha\OneDrive\Documentos\ProyectosCursor\MiPrimerProyecto"
git rm --cached insertar-cliente-syp-solutions-simple.sql
git add -A
git commit -m "Eliminar insertar-cliente-syp-solutions-simple.sql y otros archivos faltantes"
```

## Si Aparecen Más Archivos Faltantes

Si aparecen más errores similares, ejecuta este script para limpiar TODOS los archivos faltantes de una vez:

```powershell
cd "C:\Users\ronha\OneDrive\Documentos\ProyectosCursor\MiPrimerProyecto"

# Encontrar y eliminar TODOS los archivos faltantes
git ls-files | Where-Object { -not (Test-Path $_) } | ForEach-Object {
    git rm --cached $_
    Write-Host "Eliminado: $_"
}

# Hacer commit
git add -A
git commit -m "Limpiar: Eliminar todos los archivos faltantes del proyecto"
```

O ejecuta el script automático:
```powershell
.\limpiar-todo.ps1
```

## Verificación

Para verificar que no quedan archivos faltantes:

```powershell
git ls-files | Where-Object { -not (Test-Path $_) }
```

Si este comando no devuelve nada, significa que Git está completamente limpio.

## Nota Importante

- `git rm --cached` solo elimina el archivo del índice de Git, no del historial
- Los archivos eliminados seguirán existiendo en commits anteriores
- Esto no afecta el historial del repositorio, solo el estado actual

