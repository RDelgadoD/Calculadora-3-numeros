-- Script: supabase-descuentos-productos-config.sql
-- Objetivo: Crear la tabla de configuración de descuentos por producto/servicio
-- NOTA: Este script asume que ya existen:
--   - Tabla public.clientes
--   - Tabla public.producto_servicio
--   - Tipos ENUM:
--       segmento_cliente   ('Gobierno Colombia', 'Privado Colombia')
--       tipo_descuento     ('Gasto', 'Descuento entidad pública', 'Otro')
--       base_descuento     ('Precio venta', 'Precio antes de Iva')

-- Si todavía no tienes esos ENUM, créalos primero o ajusta los tipos de columna

-- ===========================================
-- TABLA: descuentos_productos_config
-- ===========================================

CREATE TABLE IF NOT EXISTS public.descuentos_productos_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant / cliente dueño de la configuración
  cliente_id UUID NOT NULL
    REFERENCES public.clientes (id) ON DELETE CASCADE,

  -- Producto / servicio al que aplica el descuento
  producto_servicio_id UUID
    REFERENCES public.producto_servicio (id) ON DELETE CASCADE,

  -- Nombre descriptivo del descuento
  nombre TEXT NOT NULL,

  -- Segmento de cliente al que aplica
  segmento_cliente segmento_cliente NOT NULL DEFAULT 'Gobierno Colombia',

  -- Tipo de descuento / gasto
  tipo_descuento tipo_descuento NOT NULL DEFAULT 'Gasto',

  -- Base sobre la cual se calcula
  base_descuento base_descuento NOT NULL DEFAULT 'Precio venta',

  -- Fórmula en texto libre (se evaluará en el frontend)
  formula_descuento TEXT,

  -- Valor calculado del descuento/gasto
  valor_descuento NUMERIC(18,2) NOT NULL DEFAULT 0,

  -- Indicador de si el descuento está activo
  activo BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ===========================================
-- TRIGGER: actualizar updated_at
-- ===========================================

CREATE OR REPLACE FUNCTION public.set_updated_at_descuentos_productos_config()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_set_updated_at_descuentos_productos_config'
  ) THEN
    CREATE TRIGGER trg_set_updated_at_descuentos_productos_config
    BEFORE UPDATE ON public.descuentos_productos_config
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at_descuentos_productos_config();
  END IF;
END;
$$;


-- ===========================================
-- RLS (opcional, ajusta a tu modelo de multi-tenant)
-- ===========================================

ALTER TABLE public.descuentos_productos_config
  ENABLE ROW LEVEL SECURITY;

-- IMPORTANTE: Ajusta las políticas a tu modelo actual.
-- Ejemplo simple (suponiendo que tienes una función que retorna el cliente actual):
--
--   CREATE POLICY "select_descuentos_por_cliente"
--   ON public.descuentos_productos_config
--   FOR SELECT
--   USING (cliente_id = get_current_cliente_id());
--
--   CREATE POLICY "crud_descuentos_por_cliente"
--   ON public.descuentos_productos_config
--   FOR ALL
--   USING (cliente_id = get_current_cliente_id())
--   WITH CHECK (cliente_id = get_current_cliente_id());
--
-- Si no tienes esa función, puedes crear las políticas más adelante según tu esquema.


