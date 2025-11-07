-- Script para crear usuario administrador: Lina Baastidas
-- IMPORTANTE: Ejecuta esto DESPUÉS de:
--   1. Ejecutar crear-cliente-ot-piendamo.sql
--   2. Crear usuario en Authentication > Users con email: ronhalddelgado@gmail.com
--   3. Copiar el UUID del usuario de auth.users
--   4. Copiar el ID del cliente creado

-- PASO 1: Reemplaza 'UUID_DEL_USUARIO_AUTH' con el UUID del usuario creado en Authentication
-- PASO 2: Reemplaza 'UUID_DEL_CLIENTE' con el ID del cliente "OT Piendamo"

INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  cliente_id,
  rol,
  activo
)
VALUES (
  'UUID_DEL_USUARIO_AUTH'::uuid,        -- Reemplaza con UUID de auth.users
  'ronhalddelgado@gmail.com',
  'Lina Baastidas',
  'UUID_DEL_CLIENTE'::uuid,             -- Reemplaza con ID del cliente "OT Piendamo"
  'admin',
  true
)
RETURNING id, nombre_completo, email, cliente_id, rol, activo;

-- Si todo está bien, verás el registro creado con todos los datos

