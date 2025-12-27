# Solución Inmediata al Error de Cliente

## El Problema

El error "El cliente/entidad asociado no existe o no es válido" significa que tu usuario no tiene un `cliente_id` asignado en la tabla `usuarios`.

## Solución Rápida (2 minutos)

### Ejecutar en Supabase SQL Editor:

1. Ve a https://app.supabase.com
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Copia y pega este script COMPLETO:

```sql
-- Crear cliente si no existe
INSERT INTO clientes (nombre, activo)
VALUES ('OT Piendamo Cauca', true)
ON CONFLICT DO NOTHING;

-- Asignar cliente a todos los usuarios sin cliente
WITH cliente_default AS (
  SELECT id FROM clientes WHERE nombre = 'OT Piendamo Cauca' LIMIT 1
)
UPDATE usuarios
SET cliente_id = (SELECT id FROM cliente_default)
WHERE cliente_id IS NULL
  AND activo = true;
```

5. Haz clic en **RUN** o presiona Ctrl+Enter
6. **Cierra sesión** en la aplicación web
7. **Vuelve a iniciar sesión**
8. Intenta guardar el banco nuevamente

## Verificación

Para verificar que funcionó, ejecuta esto en Supabase SQL Editor:

```sql
SELECT 
  u.email,
  u.cliente_id,
  c.nombre as cliente_nombre
FROM usuarios u
LEFT JOIN clientes c ON u.cliente_id = c.id
WHERE u.email = 'TU_EMAIL@ejemplo.com';
```

Deberías ver tu email con un `cliente_id` y `cliente_nombre` asignados.

## Si el Error Persiste

Si después de ejecutar el script el error continúa:

1. **Verifica que ejecutaste el script completo** (ambas partes: INSERT y UPDATE)
2. **Cierra sesión y vuelve a iniciar sesión** (esto recarga la información del usuario)
3. **Verifica los logs del backend** - deberían mostrar qué `clienteId` tiene tu usuario
4. **Revisa la consola del navegador** - debería mostrar el `userInfo.clienteId`

## Archivo con el Script

El script completo está en: `fix-cliente-usuario-FINAL.sql`

