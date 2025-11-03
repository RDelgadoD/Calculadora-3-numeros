-- Script SQL para actualizar la tabla existente con autenticación
-- Ejecuta este script SI YA TIENES la tabla calculos creada

-- Agregar columna user_id si no existe
ALTER TABLE calculos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_calculos_user_id ON calculos(user_id);

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
