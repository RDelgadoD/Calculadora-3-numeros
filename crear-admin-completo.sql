-- Script completo para crear usuario administrador
-- IMPORTANTE: Reemplaza TODOS los valores marcados antes de ejecutar

-- PASO 1: Ejecuta este script DESPUÉS de haber:
--   1. Ejecutado supabase-saas-setup.sql
--   2. Creado un cliente (puedes usar crear-primer-cliente.sql)
--   3. Creado un usuario en Authentication > Users

-- PASO 2: Obtén estos valores:
--   - UUID del usuario de auth.users (de Authentication > Users)
--   - ID del cliente (de la tabla clientes)

-- PASO 3: Reemplaza los valores en este INSERT:

INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  cliente_id,
  rol,
  activo
)
VALUES (
  'REEMPLAZA_CON_UUID_USUARIO_AUTH'::uuid,  -- UUID del usuario en auth.users
  'REEMPLAZA_CON_EMAIL',                     -- Email del usuario
  'REEMPLAZA_CON_NOMBRE_COMPLETO',           -- Ej: "Pedro Pérez"
  'REEMPLAZA_CON_ID_CLIENTE'::uuid,          -- ID del cliente creado
  'admin',                                    -- Rol: admin
  true                                        -- Activo
)
RETURNING id, nombre_completo, email, cliente_id, rol;

-- Si todo está bien, verás el registro creado

