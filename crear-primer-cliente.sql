-- Script para crear tu primer cliente
-- Reemplaza 'Nombre de tu Cliente' con el nombre que deseas

INSERT INTO clientes (nombre, activo)
VALUES ('Nombre de tu Cliente', true)
RETURNING id, nombre, created_at;

-- IMPORTANTE: Copia el ID que aparece después de ejecutar
-- Lo necesitarás para crear el usuario administrador

