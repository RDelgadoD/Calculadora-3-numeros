-- Script para verificar y asignar cliente a un usuario
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Verificar si existen clientes
SELECT 
  id, 
  nombre, 
  activo,
  created_at
FROM clientes
ORDER BY created_at DESC
LIMIT 10;

-- PASO 2: Verificar usuarios y su cliente_id
SELECT 
  u.id,
  u.email,
  u.nombre_completo,
  u.cliente_id,
  u.rol,
  c.nombre as cliente_nombre
FROM usuarios u
LEFT JOIN clientes c ON u.cliente_id = c.id
ORDER BY u.created_at DESC
LIMIT 10;

-- PASO 3: Si no hay clientes, crear uno por defecto
-- (Ejecutar solo si no hay clientes)
INSERT INTO clientes (nombre, activo)
VALUES ('OT Piendamo Cauca', true)
ON CONFLICT DO NOTHING
RETURNING *;

-- PASO 4: Obtener el ID del cliente que quieres usar
-- Reemplaza 'OT Piendamo Cauca' con el nombre de tu cliente
SELECT id, nombre FROM clientes WHERE nombre = 'OT Piendamo Cauca' LIMIT 1;

-- PASO 5: Asignar cliente a un usuario específico
-- IMPORTANTE: Reemplaza 'TU_EMAIL_AQUI@ejemplo.com' con tu email real
-- Y reemplaza 'CLIENTE_ID_AQUI' con el ID del cliente del paso anterior
UPDATE usuarios
SET cliente_id = (
  SELECT id FROM clientes WHERE nombre = 'OT Piendamo Cauca' LIMIT 1
)
WHERE email = 'TU_EMAIL_AQUI@ejemplo.com'
RETURNING id, email, nombre_completo, cliente_id;

-- PASO 6: Verificar que la actualización fue exitosa
SELECT 
  u.id,
  u.email,
  u.nombre_completo,
  u.cliente_id,
  c.nombre as cliente_nombre
FROM usuarios u
LEFT JOIN clientes c ON u.cliente_id = c.id
WHERE u.email = 'TU_EMAIL_AQUI@ejemplo.com';

