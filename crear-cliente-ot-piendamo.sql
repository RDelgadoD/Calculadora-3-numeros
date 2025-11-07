-- Script para crear el cliente "OT Piendamo"
-- Ejecuta este script en Supabase > SQL Editor

INSERT INTO clientes (nombre, activo)
VALUES ('OT Piendamo', true)
RETURNING id, nombre, created_at;

-- IMPORTANTE: Copia el ID que aparece después de ejecutar
-- Lo necesitarás para el siguiente paso

