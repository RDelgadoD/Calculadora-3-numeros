-- Script SQL simple para asignar cliente por defecto
-- Ejecutar directamente en Supabase SQL Editor

-- 1. Crear cliente por defecto si no existe
INSERT INTO clientes (nombre, activo)
VALUES ('OT Piendamo Cauca', true)
ON CONFLICT DO NOTHING;

-- 2. Asignar cliente a todos los usuarios sin cliente
UPDATE usuarios
SET cliente_id = (
  SELECT id FROM clientes WHERE nombre = 'OT Piendamo Cauca' LIMIT 1
)
WHERE cliente_id IS NULL 
  AND activo = true;

-- 3. Verificar resultado
SELECT 
  u.id,
  u.email,
  u.nombre_completo,
  u.cliente_id,
  c.nombre as cliente_nombre,
  u.rol
FROM usuarios u
LEFT JOIN clientes c ON u.cliente_id = c.id
ORDER BY u.created_at DESC;

