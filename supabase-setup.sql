-- Script SQL para crear la tabla en Supabase
-- Ejecuta este script en el SQL Editor de Supabase

-- Crear tabla para guardar los cálculos
CREATE TABLE IF NOT EXISTS calculos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  numero1 DECIMAL(15, 2) NOT NULL,
  numero2 DECIMAL(15, 2) NOT NULL,
  numero3 DECIMAL(15, 2) NOT NULL,
  operacion VARCHAR(50) NOT NULL,
  resultado TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_calculos_created_at ON calculos(created_at DESC);

-- Crear índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_calculos_user_id ON calculos(user_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE calculos ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Permitir inserción pública de cálculos" ON calculos;
DROP POLICY IF EXISTS "Permitir lectura pública de cálculos" ON calculos;

-- Política: Solo usuarios autenticados pueden insertar cálculos
CREATE POLICY "Solo usuarios autenticados pueden insertar"
  ON calculos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden ver sus propios cálculos
CREATE POLICY "Usuarios ven solo sus cálculos"
  ON calculos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
