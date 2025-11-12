-- Script SQL para convertir la aplicación en SaaS Multi-Tenant
-- Ejecuta este script en el SQL Editor de Supabase DESPUÉS de haber ejecutado supabase-setup.sql

-- 1. Crear tabla de clientes/entidades
CREATE TABLE IF NOT EXISTS clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla de usuarios del sistema (extiende auth.users)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT true,
  rol VARCHAR(50) DEFAULT 'usuario', -- 'admin', 'usuario'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Agregar columna cliente_id a la tabla calculos
ALTER TABLE calculos 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE;

-- 4. Crear índices
CREATE INDEX IF NOT EXISTS idx_usuarios_cliente_id ON usuarios(cliente_id);
CREATE INDEX IF NOT EXISTS idx_calculos_cliente_id ON calculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_calculos_user_cliente ON calculos(user_id, cliente_id);

-- 5. Habilitar RLS en las nuevas tablas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- 6. Funciones auxiliares para políticas (evitan recursividad)
CREATE OR REPLACE FUNCTION fn_get_user_cliente_id(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  _cliente_id UUID;
BEGIN
  SELECT cliente_id INTO _cliente_id
  FROM usuarios
  WHERE id = user_uuid
  LIMIT 1;

  RETURN _cliente_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION fn_user_is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  _is_admin BOOLEAN;
BEGIN
  SELECT (rol = 'admin') INTO _is_admin
  FROM usuarios
  WHERE id = user_uuid
  LIMIT 1;

  RETURN COALESCE(_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION fn_get_user_cliente_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION fn_user_is_admin(UUID) TO authenticated;

-- 7. Políticas para clientes
DROP POLICY IF EXISTS "Los usuarios solo ven su propio cliente" ON clientes;
DROP POLICY IF EXISTS "Admins ven todos los clientes" ON clientes;
DROP POLICY IF EXISTS "Admins pueden insertar clientes" ON clientes;
DROP POLICY IF EXISTS clientes_select_mine ON clientes;
DROP POLICY IF EXISTS clientes_insert_admin ON clientes;

CREATE POLICY clientes_select_mine
  ON clientes
  FOR SELECT
  TO authenticated
  USING (
    id = fn_get_user_cliente_id(auth.uid()) OR fn_user_is_admin(auth.uid())
  );

CREATE POLICY clientes_insert_admin
  ON clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (fn_user_is_admin(auth.uid()));

-- 8. Políticas para usuarios
DROP POLICY IF EXISTS "Usuarios ven solo usuarios de su cliente" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden insertar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden actualizar usuarios" ON usuarios;
DROP POLICY IF EXISTS usuarios_select_mine ON usuarios;
DROP POLICY IF EXISTS usuarios_insert_admin ON usuarios;
DROP POLICY IF EXISTS usuarios_update_admin ON usuarios;

CREATE POLICY usuarios_select_mine
  ON usuarios
  FOR SELECT
  TO authenticated
  USING (
    cliente_id = fn_get_user_cliente_id(auth.uid()) OR fn_user_is_admin(auth.uid())
  );

CREATE POLICY usuarios_insert_admin
  ON usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (fn_user_is_admin(auth.uid()));

CREATE POLICY usuarios_update_admin
  ON usuarios
  FOR UPDATE
  TO authenticated
  USING (fn_user_is_admin(auth.uid()));


-- 9. Actualizar políticas de calculos para incluir cliente_id
DROP POLICY IF EXISTS "Solo usuarios autenticados pueden insertar" ON calculos;
DROP POLICY IF EXISTS "Usuarios ven solo sus cálculos" ON calculos;
DROP POLICY IF EXISTS calculos_insert_cliente ON calculos;
DROP POLICY IF EXISTS calculos_select_cliente ON calculos;

-- Nueva política: Usuarios solo pueden insertar cálculos de su cliente
CREATE POLICY calculos_insert_cliente
  ON calculos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    (
      cliente_id = fn_get_user_cliente_id(auth.uid())
      OR fn_user_is_admin(auth.uid())
    )
  );

-- Nueva política: Usuarios solo ven cálculos de su cliente
CREATE POLICY calculos_select_cliente
  ON calculos
  FOR SELECT
  TO authenticated
  USING (
    cliente_id = fn_get_user_cliente_id(auth.uid())
    OR fn_user_is_admin(auth.uid())
  );

-- 10. Función para crear usuario automáticamente después del registro
CREATE OR REPLACE FUNCTION crear_usuario_desde_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Esta función se llamará después de que se cree un usuario en auth.users
  -- Nota: Necesitarás crear el registro en usuarios manualmente o usar una función trigger
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Crear función para obtener información del usuario actual
CREATE OR REPLACE FUNCTION get_user_info(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  nombre_completo VARCHAR,
  email VARCHAR,
  cliente_id UUID,
  cliente_nombre VARCHAR,
  activo BOOLEAN,
  rol VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.nombre_completo,
    u.email,
    u.cliente_id,
    c.nombre AS cliente_nombre,
    u.activo,
    u.rol
  FROM usuarios u
  JOIN clientes c ON u.cliente_id = c.id
  WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION get_user_info(UUID) TO authenticated;
