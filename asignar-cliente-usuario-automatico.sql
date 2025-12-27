-- Script para asignar automáticamente un cliente a usuarios que no tengan uno
-- Este script crea un cliente por defecto si no existe y asigna usuarios sin cliente

-- 1. Crear cliente por defecto si no existe
INSERT INTO clientes (nombre, activo)
VALUES ('OT Piendamo Cauca', true)
ON CONFLICT DO NOTHING
RETURNING id, nombre;

-- 2. Obtener el ID del cliente por defecto
DO $$
DECLARE
  cliente_default_id UUID;
BEGIN
  -- Obtener o crear el cliente por defecto
  SELECT id INTO cliente_default_id
  FROM clientes
  WHERE nombre = 'OT Piendamo Cauca'
  LIMIT 1;
  
  -- Si no existe, crearlo
  IF cliente_default_id IS NULL THEN
    INSERT INTO clientes (nombre, activo)
    VALUES ('OT Piendamo Cauca', true)
    RETURNING id INTO cliente_default_id;
  END IF;
  
  -- Asignar el cliente a todos los usuarios que no tengan uno
  UPDATE usuarios
  SET cliente_id = cliente_default_id
  WHERE cliente_id IS NULL
    AND activo = true;
  
  RAISE NOTICE 'Cliente asignado a usuarios sin cliente. Cliente ID: %', cliente_default_id;
END $$;

-- 3. Verificar el resultado
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

