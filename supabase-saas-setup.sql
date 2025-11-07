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

-- 6. Políticas para clientes
CREATE POLICY "Los usuarios solo ven su propio cliente"
  ON clientes
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    ) OR
    -- Los admins pueden ver todos los clientes
    id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política alternativa: Admins ven todos los clientes
CREATE POLICY "Admins ven todos los clientes"
  ON clientes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- 7. Políticas para usuarios
CREATE POLICY "Usuarios ven solo usuarios de su cliente"
  ON usuarios
  FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    ) OR
    -- Los admins pueden ver todos los usuarios
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- 8. Política para insertar usuarios (solo admins)
CREATE POLICY "Admins pueden insertar usuarios"
  ON usuarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para actualizar usuarios (solo admins)
CREATE POLICY "Admins pueden actualizar usuarios"
  ON usuarios
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Política para insertar clientes (solo admins)
CREATE POLICY "Admins pueden insertar clientes"
  ON clientes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- 9. Actualizar políticas de calculos para incluir cliente_id
DROP POLICY IF EXISTS "Solo usuarios autenticados pueden insertar" ON calculos;
DROP POLICY IF EXISTS "Usuarios ven solo sus cálculos" ON calculos;

-- Nueva política: Usuarios solo pueden insertar cálculos de su cliente
CREATE POLICY "Usuarios insertan cálculos de su cliente"
  ON calculos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    cliente_id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- Nueva política: Usuarios solo ven cálculos de su cliente
CREATE POLICY "Usuarios ven cálculos de su cliente"
  ON calculos
  FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    )
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
