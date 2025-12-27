-- Script para crear las tablas de gestión financiera
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Crear ENUM para conceptos de ingreso
CREATE TYPE concepto_ingreso_enum AS ENUM (
  'Pago contrato',
  'Devolución',
  'Aporte socios',
  'Ventas en efectivo',
  'Otros'
);

-- 2. Crear ENUM para nombres de bancos
CREATE TYPE banco_nombre_enum AS ENUM (
  'Banco de Occidente',
  'Banco de Bogotá',
  'Bancolombia',
  'Banco Davivienda',
  'Banco Mundo mujer',
  'Banco Caja Social',
  'Banco Av Villas'
);

-- 3. Crear ENUM para tipo de cuenta
CREATE TYPE tipo_cuenta_enum AS ENUM (
  'Cuenta de ahorros',
  'Cuenta corriente'
);

-- 4. Crear tabla bancos (cuentas bancarias)
CREATE TABLE IF NOT EXISTS bancos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  banco_nombre banco_nombre_enum NOT NULL,
  tipo_cuenta tipo_cuenta_enum NOT NULL,
  numero_cuenta text NOT NULL,
  activo boolean DEFAULT true,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cliente_id, banco_nombre, tipo_cuenta, numero_cuenta)
);

-- 5. Crear tabla conceptos_ingreso (para gestión de conceptos)
CREATE TABLE IF NOT EXISTS conceptos_ingreso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre concepto_ingreso_enum NOT NULL UNIQUE,
  descripcion text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Crear tabla ingresos
CREATE TABLE IF NOT EXISTS ingresos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_ingreso date NOT NULL DEFAULT CURRENT_DATE,
  concepto_ingreso_id uuid NOT NULL REFERENCES conceptos_ingreso(id),
  cuenta_bancaria_id uuid REFERENCES bancos(id) ON DELETE SET NULL,
  valor_ingreso numeric(15, 2) NOT NULL CHECK (valor_ingreso > 0),
  contrato_id uuid REFERENCES contracts(id) ON DELETE SET NULL,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  observaciones text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES usuarios(id),
  updated_by uuid REFERENCES usuarios(id)
);

-- 7. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_ingresos_fecha ON ingresos(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_ingresos_cliente ON ingresos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_contrato ON ingresos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_ingresos_concepto ON ingresos(concepto_ingreso_id);
CREATE INDEX IF NOT EXISTS idx_bancos_cliente ON bancos(cliente_id);

-- 8. Habilitar RLS (Row Level Security)
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conceptos_ingreso ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;

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

-- 10. Políticas RLS para conceptos_ingreso (todos los usuarios pueden verlos)
CREATE POLICY "Todos pueden ver conceptos activos"
  ON conceptos_ingreso FOR SELECT
  USING (activo = true);

CREATE POLICY "Solo admins pueden gestionar conceptos"
  ON conceptos_ingreso FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE id = auth.uid() 
      AND rol = 'admin'
    )
  );

-- 11. Políticas RLS para ingresos
CREATE POLICY "Usuarios pueden ver ingresos de su cliente"
  ON ingresos FOR SELECT
  USING (
    cliente_id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden crear ingresos de su cliente"
  ON ingresos FOR INSERT
  WITH CHECK (
    cliente_id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden actualizar ingresos de su cliente"
  ON ingresos FOR UPDATE
  USING (
    cliente_id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    )
  );

CREATE POLICY "Usuarios pueden eliminar ingresos de su cliente"
  ON ingresos FOR DELETE
  USING (
    cliente_id IN (
      SELECT cliente_id FROM usuarios WHERE id = auth.uid()
    )
  );

-- 12. Insertar datos iniciales de conceptos_ingreso
INSERT INTO conceptos_ingreso (nombre, descripcion, activo) VALUES
  ('Pago contrato', 'Ingresos por pagos de contratos', true),
  ('Devolución', 'Devoluciones recibidas', true),
  ('Aporte socios', 'Aportes de socios', true),
  ('Ventas en efectivo', 'Ventas realizadas en efectivo', true),
  ('Otros', 'Otros tipos de ingresos', true)
ON CONFLICT (nombre) DO NOTHING;

-- 13. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 14. Triggers para updated_at
CREATE TRIGGER update_bancos_updated_at
  BEFORE UPDATE ON bancos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conceptos_ingreso_updated_at
  BEFORE UPDATE ON conceptos_ingreso
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingresos_updated_at
  BEFORE UPDATE ON ingresos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 15. Validación: Si concepto es "Pago contrato", contrato_id debe estar presente
CREATE OR REPLACE FUNCTION validate_ingreso_contrato()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.concepto_ingreso_id = (SELECT id FROM conceptos_ingreso WHERE nombre = 'Pago contrato') THEN
    IF NEW.contrato_id IS NULL THEN
      RAISE EXCEPTION 'El contrato es obligatorio cuando el concepto es "Pago contrato"';
    END IF;
  ELSE
    -- Si no es "Pago contrato", asegurar que contrato_id sea NULL
    NEW.contrato_id = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ingreso_contrato_trigger
  BEFORE INSERT OR UPDATE ON ingresos
  FOR EACH ROW
  EXECUTE FUNCTION validate_ingreso_contrato();

