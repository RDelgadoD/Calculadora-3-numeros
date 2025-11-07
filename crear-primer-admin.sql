-- Script para crear el primer cliente y usuario administrador
-- IMPORTANTE: Ajusta los valores según tus necesidades antes de ejecutar

-- PASO 1: Crear el primer cliente
-- Reemplaza 'Nombre de tu Cliente' con el nombre real
INSERT INTO clientes (nombre, activo)
VALUES ('Nombre de tu Cliente', true)
RETURNING id, nombre;

-- PASO 2: Copia el ID del cliente que se muestra arriba
-- Lo necesitarás para el siguiente paso

-- PASO 3: Crear usuario en auth.users
-- Ve a Supabase > Authentication > Users > Add user
-- Email: admin@tudominio.com
-- Password: (elige una contraseña segura)
-- Copia el UUID del usuario creado

-- PASO 4: Crear registro en tabla usuarios
-- IMPORTANTE: Reemplaza los siguientes valores:
-- - 'UUID_DEL_USUARIO_AUTH': El UUID del usuario creado en auth.users
-- - 'admin@tudominio.com': El email del usuario
-- - 'Nombre Completo Admin': El nombre completo del administrador
-- - 'UUID_DEL_CLIENTE': El ID del cliente creado en el PASO 1

-- Ejemplo:
/*
INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  cliente_id,
  rol,
  activo
)
VALUES (
  'UUID_DEL_USUARIO_AUTH'::uuid,
  'admin@tudominio.com',
  'Nombre Completo Admin',
  'UUID_DEL_CLIENTE'::uuid,
  'admin',
  true
);
*/

-- NOTA: Este script te guía paso a paso
-- Para ejecutar automáticamente, descomenta el INSERT de usuarios y reemplaza los valores

