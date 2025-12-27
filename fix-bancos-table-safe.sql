-- Script SEGURO para corregir la estructura de la tabla bancos
-- Este script NO elimina datos, solo corrige la estructura
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Crear ENUM para nombres de bancos si no existe
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

-- 2. Crear ENUM para tipo de cuenta si no existe
DO $$ BEGIN
  CREATE TYPE tipo_cuenta_enum AS ENUM (
    'Cuenta de ahorros',
    'Cuenta corriente'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Verificar y crear la tabla bancos si no existe
CREATE TABLE IF NOT EXISTS bancos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_nombre text,
  tipo_cuenta text,
  numero_cuenta text,
  activo boolean DEFAULT true,
  cliente_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Verificar si la columna banco_nombre existe y es del tipo correcto
DO $$ 
BEGIN
  -- Si la columna no existe, crearla
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bancos' AND column_name = 'banco_nombre'
  ) THEN
    ALTER TABLE bancos ADD COLUMN banco_nombre banco_nombre_enum;
  END IF;

  -- Si la columna existe pero es de tipo text, convertirla a ENUM
  -- Nota: Esto solo funciona si todos los valores actuales están en el ENUM
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bancos' 
    AND column_name = 'banco_nombre' 
    AND data_type = 'text'
  ) THEN
    -- Primero convertir los valores a ENUM usando una columna temporal
    ALTER TABLE bancos ADD COLUMN banco_nombre_temp banco_nombre_enum;
    UPDATE bancos SET banco_nombre_temp = banco_nombre::banco_nombre_enum 
    WHERE banco_nombre IN (
      'Banco de Occidente', 'Banco de Bogotá', 'Bancolombia', 
      'Banco Davivienda', 'Banco Mundo mujer', 'Banco Caja Social', 'Banco Av Villas'
    );
    ALTER TABLE bancos DROP COLUMN banco_nombre;
    ALTER TABLE bancos RENAME COLUMN banco_nombre_temp TO banco_nombre;
    ALTER TABLE bancos ALTER COLUMN banco_nombre SET NOT NULL;
  END IF;
END $$;

-- 5. Verificar tipo_cuenta
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bancos' AND column_name = 'tipo_cuenta'
  ) THEN
    ALTER TABLE bancos ADD COLUMN tipo_cuenta tipo_cuenta_enum;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bancos' 
    AND column_name = 'tipo_cuenta' 
    AND data_type = 'text'
  ) THEN
    ALTER TABLE bancos ADD COLUMN tipo_cuenta_temp tipo_cuenta_enum;
    UPDATE bancos SET tipo_cuenta_temp = tipo_cuenta::tipo_cuenta_enum 
    WHERE tipo_cuenta IN ('Cuenta de ahorros', 'Cuenta corriente');
    ALTER TABLE bancos DROP COLUMN tipo_cuenta;
    ALTER TABLE bancos RENAME COLUMN tipo_cuenta_temp TO tipo_cuenta;
    ALTER TABLE bancos ALTER COLUMN tipo_cuenta SET NOT NULL;
  END IF;
END $$;

-- 6. Agregar restricciones si no existen
DO $$ 
BEGIN
  -- Restricción NOT NULL para numero_cuenta
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bancos' AND column_name = 'numero_cuenta' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE bancos ALTER COLUMN numero_cuenta SET NOT NULL;
  END IF;

  -- Restricción UNIQUE
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bancos_cliente_banco_tipo_numero_key'
  ) THEN
    ALTER TABLE bancos 
    ADD CONSTRAINT bancos_cliente_banco_tipo_numero_key 
    UNIQUE(cliente_id, banco_nombre, tipo_cuenta, numero_cuenta);
  END IF;
END $$;

-- 7. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_bancos_cliente ON bancos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_bancos_nombre ON bancos(banco_nombre);
CREATE INDEX IF NOT EXISTS idx_bancos_activo ON bancos(activo);

-- 8. Habilitar RLS
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;

-- 9. Eliminar políticas existentes si las hay (para recrearlas)
DROP POLICY IF EXISTS "Usuarios pueden ver bancos de su cliente" ON bancos;
DROP POLICY IF EXISTS "Usuarios pueden crear bancos de su cliente" ON bancos;
DROP POLICY IF EXISTS "Usuarios pueden actualizar bancos de su cliente" ON bancos;
DROP POLICY IF EXISTS "Usuarios pueden eliminar bancos de su cliente" ON bancos;

-- 10. Crear políticas RLS
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

-- 11. Crear función para updated_at si no existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_bancos_updated_at ON bancos;
CREATE TRIGGER update_bancos_updated_at
  BEFORE UPDATE ON bancos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


