-- Script FINAL para asignar cliente a usuarios
-- Ejecutar TODO este script en Supabase SQL Editor de una vez

-- Paso 1: Crear cliente si no existe
INSERT INTO clientes (nombre, activo)
VALUES ('OT Piendamo Cauca', true)
ON CONFLICT (id) DO NOTHING;

-- Paso 2: Asignar cliente a TODOS los usuarios sin cliente (en un solo comando)
WITH cliente_default AS (
  SELECT id FROM clientes WHERE nombre = 'OT Piendamo Cauca' LIMIT 1
)
UPDATE usuarios
SET cliente_id = (SELECT id FROM cliente_default)
WHERE cliente_id IS NULL
  AND activo = true;

-- Paso 3: Verificar resultado
SELECT 
  u.email,
  u.nombre_completo,
  u.cliente_id,
  c.nombre as cliente_nombre,
  u.rol
FROM usuarios u
LEFT JOIN clientes c ON u.cliente_id = c.id
ORDER BY u.created_at DESC;

