# Solución al Error: "Could not find the 'banco_nombre' column"

## Problema
El error indica que la columna `banco_nombre` no existe en la tabla `bancos` de Supabase, o que la estructura de la tabla no coincide con lo esperado por el código.

## Solución Rápida (Recomendada)

### Opción 1: Ejecutar el script SQL para recrear la tabla (si no tienes datos importantes)

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `fix-bancos-table.sql`
4. Ejecuta el script

**⚠️ ADVERTENCIA: Este script ELIMINARÁ todos los datos de la tabla `bancos`**

### Opción 2: Ejecutar el script seguro (si quieres mantener datos existentes)

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `fix-bancos-table-safe.sql`
4. Ejecuta el script

Este script intentará convertir la estructura existente sin perder datos.

### Opción 3: Crear la tabla desde cero (si no existe)

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Abre el **SQL Editor**
3. Copia y pega el contenido del archivo `create-tables-financieras.sql`
4. Ejecuta el script

## Verificación

Después de ejecutar cualquiera de los scripts, verifica que la tabla tenga la estructura correcta:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bancos'
ORDER BY ordinal_position;
```

Deberías ver estas columnas:
- `id` (uuid)
- `banco_nombre` (banco_nombre_enum o text)
- `tipo_cuenta` (tipo_cuenta_enum o text)
- `numero_cuenta` (text)
- `activo` (boolean)
- `cliente_id` (uuid)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Si el problema persiste

Si después de ejecutar los scripts el error continúa, puede ser un problema de caché de schema en Supabase. En ese caso:

1. Espera unos minutos para que se actualice el schema cache
2. O contacta a soporte de Supabase


