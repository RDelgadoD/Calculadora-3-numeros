-- Script de diagnóstico y corrección para asignar cliente a usuarios
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Ver todos los clientes existentes
SELECT 
  id, 
  nombre, 
  activo,
  created_at
FROM clientes
ORDER BY created_at DESC;

-- PASO 2: Ver todos los usuarios y su cliente_id
SELECT 
  u.id,
  u.email,
  u.nombre_completo,
  u.cliente_id,
  u.rol,
  u.activo,
  c.nombre as cliente_nombre
FROM usuarios u
LEFT JOIN clientes c ON u.cliente_id = c.id
ORDER BY u.created_at DESC;

-- PASO 3: Crear cliente "OT Piendamo Cauca" si no existe
INSERT INTO clientes (nombre, activo)
VALUES ('OT Piendamo Cauca', true)
ON CONFLICT DO NOTHING
RETURNING id, nombre;

-- PASO 4: Obtener el ID del cliente (ejecutar después del paso 3)
SELECT id, nombre 
FROM clientes 
WHERE nombre = 'OT Piendamo Cauca' 
LIMIT 1;

-- PASO 5: Asignar cliente a TODOS los usuarios que no tengan uno (ACTIVOS)
DO $$
DECLARE
  cliente_default_id UUID;
  usuarios_actualizados INTEGER;
BEGIN
  -- Obtener el ID del cliente por defecto
  SELECT id INTO cliente_default_id
  FROM clientes
  WHERE nombre = 'OT Piendamo Cauca'
  LIMIT 1;
  
  -- Si no existe, crearlo
  IF cliente_default_id IS NULL THEN
    INSERT INTO clientes (nombre, activo)
    VALUES ('OT Piendamo Cauca', true)
    RETURNING id INTO cliente_default_id;
    
    RAISE NOTICE 'Cliente creado con ID: %', cliente_default_id;
  ELSE
    RAISE NOTICE 'Cliente encontrado con ID: %', cliente_default_id;
  END IF;
  
  -- Asignar el cliente a todos los usuarios activos sin cliente
  UPDATE usuarios
  SET cliente_id = cliente_default_id
  WHERE cliente_id IS NULL
    AND activo = true;
  
  GET DIAGNOSTICS usuarios_actualizados = ROW_COUNT;
  
  RAISE NOTICE 'Usuarios actualizados: %', usuarios_actualizados;
END $$;

-- PASO 6: Verificar resultado final
SELECT 
  u.id,
  u.email,
  u.nombre_completo,
  u.cliente_id,
  c.nombre as cliente_nombre,
  u.rol,
  u.activo
FROM usuarios u
LEFT JOIN clientes c ON u.cliente_id = c.id
ORDER BY u.created_at DESC;

-- PASO 7: Verificar usuarios sin cliente (debería estar vacío)
SELECT 
  u.id,
  u.email,
  u.nombre_completo,
  u.cliente_id
FROM usuarios u
WHERE u.cliente_id IS NULL
  AND u.activo = true;

