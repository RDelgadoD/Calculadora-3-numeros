-- Script para corregir/crear la estructura de la tabla bancos
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Eliminar la tabla bancos si existe (esto eliminará los datos, ten cuidado)
-- Si quieres mantener los datos, comenta esta línea y usa el script de migración
-- DROP TABLE IF EXISTS bancos CASCADE;

-- 2. Crear ENUM para nombres de bancos si no existe
DO $$ BEGIN
  CREATE TYPE banco_nombre_enum AS ENUM (
    'Banco de Occidente',
    'Banco de Bogotá',
    'Bancolombia',
    'Banco Davivienda',
    'Banco Mundo mujer',
    'Banco Caja Social',
    'Banco Av Villas'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Crear ENUM para tipo de cuenta si no existe
DO $$ BEGIN
  CREATE TYPE tipo_cuenta_enum AS ENUM (
    'Cuenta de ahorros',
    'Cuenta corriente'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 4. Eliminar tabla si existe (CUIDADO: esto elimina los datos)
DROP TABLE IF EXISTS bancos CASCADE;

-- 5. Crear tabla bancos con la estructura correcta
CREATE TABLE bancos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_nombre banco_nombre_enum NOT NULL,
  tipo_cuenta tipo_cuenta_enum NOT NULL,
  numero_cuenta text NOT NULL,
  activo boolean DEFAULT true,
  cliente_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cliente_id, banco_nombre, tipo_cuenta, numero_cuenta)
);

-- 6. Crear índices
CREATE INDEX idx_bancos_cliente ON bancos(cliente_id);
CREATE INDEX idx_bancos_nombre ON bancos(banco_nombre);
CREATE INDEX idx_bancos_activo ON bancos(activo);

-- 7. Habilitar RLS
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;

-- 8. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Usuarios pueden ver bancos de su cliente" ON bancos;
DROP POLICY IF EXISTS "Usuarios pueden crear bancos de su cliente" ON bancos;
DROP POLICY IF EXISTS "Usuarios pueden actualizar bancos de su cliente" ON bancos;
DROP POLICY IF EXISTS "Usuarios pueden eliminar bancos de su cliente" ON bancos;

-- 9. Políticas RLS para bancos
CREATE POLICY "Usuarios pueden ver bancos de su cliente"
  ON bancos FOR SELECT
  USING (
    cliente_id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden crear bancos de su cliente"
  ON bancos FOR INSERT
  WITH CHECK (
    cliente_id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden actualizar bancos de su cliente"
  ON bancos FOR UPDATE
  USING (
    cliente_id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden eliminar bancos de su cliente"
  ON bancos FOR DELETE
  USING (
    cliente_id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- 10. Función para actualizar updated_at automáticamente (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger para updated_at
DROP TRIGGER IF EXISTS update_bancos_updated_at ON bancos;
CREATE TRIGGER update_bancos_updated_at
  BEFORE UPDATE ON bancos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


