-- Script SIMPLIFICADO para crear/corregir la tabla bancos
-- Usa TEXT en lugar de ENUM para mayor compatibilidad
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Eliminar la tabla si existe (CUIDADO: esto elimina datos)
DROP TABLE IF EXISTS bancos CASCADE;

-- 2. Crear la tabla bancos con estructura simplificada (usando TEXT)
CREATE TABLE bancos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_nombre text NOT NULL,
  tipo_cuenta text NOT NULL,
  numero_cuenta text NOT NULL,
  activo boolean DEFAULT true,
  cliente_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cliente_id, banco_nombre, tipo_cuenta, numero_cuenta)
);

-- 3. Crear índices
CREATE INDEX idx_bancos_cliente ON bancos(cliente_id);
CREATE INDEX idx_bancos_nombre ON bancos(banco_nombre);
CREATE INDEX idx_bancos_activo ON bancos(activo);

-- 4. Habilitar RLS
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para bancos
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

-- 6. Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger para updated_at
CREATE TRIGGER update_bancos_updated_at
  BEFORE UPDATE ON bancos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


