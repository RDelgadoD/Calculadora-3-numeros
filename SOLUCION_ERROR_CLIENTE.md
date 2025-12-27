# Solución al Error: "El cliente/entidad asociado no existe o no es válido"

## Problema Identificado

El error aparece porque tu usuario no tiene un `cliente_id` asignado en la tabla `usuarios`, o el cliente asignado no existe en la tabla `clientes`.

## Solución Inmediata

Ejecuta este script SQL en Supabase SQL Editor:

### Script SQL Completo:

```sql
-- 1. Crear cliente por defecto si no existe
INSERT INTO clientes (nombre, activo)
VALUES ('OT Piendamo Cauca', true)
ON CONFLICT DO NOTHING;

-- 2. Asignar cliente a todos los usuarios sin cliente
WITH cliente_default AS (
  SELECT id FROM clientes WHERE nombre = 'OT Piendamo Cauca' LIMIT 1
)
UPDATE usuarios
SET cliente_id = (SELECT id FROM cliente_default)
WHERE cliente_id IS NULL
  AND activo = true;

-- 3. Verificar resultado
SELECT 
  u.email,
  u.nombre_completo,
  u.cliente_id,
  c.nombre as cliente_nombre,
  u.rol
FROM usuarios u
LEFT JOIN clientes c ON u.cliente_id = c.id
ORDER BY u.created_at DESC;
```

## Pasos para Ejecutar

1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral izquierdo
4. Copia y pega el script completo de arriba
5. Haz clic en **RUN** o presiona `Ctrl+Enter`
6. **Importante:** Cierra sesión en la aplicación web y vuelve a iniciar sesión
7. Intenta guardar el banco nuevamente

## Mejoras Implementadas en el Código

- ✅ Validación mejorada en el backend para verificar que el cliente existe
- ✅ Mensajes de error más descriptivos
- ✅ Logging mejorado para diagnosticar problemas
- ✅ Verificación de que el cliente está activo

## Si el Error Persiste

1. Verifica que ejecutaste TODO el script (las 3 partes)
2. Cierra sesión y vuelve a iniciar sesión (para recargar la información del usuario)
3. Revisa los logs del backend en la consola donde corre `npm run dev:full`
4. Verifica en Supabase que tu usuario tenga `cliente_id` asignado
