# 🔧 Solución: Error "Usuario no encontrado en el sistema"

## ❌ Problema

El error intermitente "Usuario no encontrado en el sistema" ocurre cuando:
1. El usuario está autenticado en Supabase Auth
2. Pero NO tiene un registro en la tabla `usuarios` de la base de datos

## ✅ Solución

### Paso 1: Verificar si el usuario existe en la tabla `usuarios`

Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Reemplaza 'tu-email@ejemplo.com' con el email del usuario que está logueado
SELECT 
  u.id,
  u.email,
  u.nombre_completo,
  u.cliente_id,
  u.rol,
  u.activo,
  c.nombre AS cliente_nombre
FROM usuarios u
LEFT JOIN clientes c ON u.cliente_id = c.id
WHERE u.email = 'tu-email@ejemplo.com';
```

### Paso 2: Si el usuario NO existe, crearlo

Ejecuta este SQL (ajusta los valores):

```sql
-- Obtener el UUID del usuario de auth.users
-- Reemplaza 'tu-email@ejemplo.com' con el email
DO $$
DECLARE
  user_uuid UUID;
  cliente_uuid UUID := '263b4183-aef4-4e4b-b916-ad4d81a30d1d'; -- Tu cliente_id
BEGIN
  -- Obtener el UUID del usuario desde auth.users
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = 'tu-email@ejemplo.com'
  LIMIT 1;

  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado en auth.users. Debes iniciar sesión primero.';
  END IF;

  -- Insertar en la tabla usuarios
  INSERT INTO usuarios (
    id,
    email,
    nombre_completo,
    cliente_id,
    rol,
    activo,
    created_at,
    updated_at
  ) VALUES (
    user_uuid,
    'tu-email@ejemplo.com',
    'Nombre Completo del Usuario', -- Cambia esto
    cliente_uuid,
    'usuario', -- o 'admin' si es administrador
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre_completo = EXCLUDED.nombre_completo,
    cliente_id = EXCLUDED.cliente_id,
    rol = EXCLUDED.rol,
    activo = EXCLUDED.activo,
    updated_at = NOW();

  RAISE NOTICE 'Usuario creado/actualizado correctamente con ID: %', user_uuid;
END $$;
```

### Paso 3: Verificar que se creó correctamente

```sql
SELECT 
  u.id,
  u.email,
  u.nombre_completo,
  u.cliente_id,
  u.rol,
  u.activo,
  c.nombre AS cliente_nombre
FROM usuarios u
LEFT JOIN clientes c ON u.cliente_id = c.id
WHERE u.email = 'tu-email@ejemplo.com';
```

## 🔍 Cambios Aplicados en el Código

### Frontend (ContractList.jsx)
- ✅ Ahora espera a que `userInfo` esté completamente cargado antes de hacer peticiones
- ✅ No muestra errores si `userInfo` aún se está cargando
- ✅ Evita peticiones duplicadas

### Backend (authMiddleware.js)
- ✅ Mensajes de error más claros
- ✅ Mejor logging para debugging

## 📝 Notas Importantes

1. **Cada usuario debe tener un registro en `usuarios`**
   - El registro debe tener el mismo `id` que en `auth.users`
   - Debe tener un `cliente_id` asignado
   - Debe estar `activo = true`

2. **El error intermitente debería desaparecer** después de:
   - Crear el registro del usuario en `usuarios`
   - Recargar la página
   - El componente ahora espera a que `userInfo` esté listo

3. **Si el error persiste:**
   - Verifica que el usuario tenga `cliente_id` asignado
   - Verifica que `activo = true`
   - Revisa la consola del navegador para más detalles

## 🚀 Después de Crear el Usuario

1. Recarga la página (F5)
2. El error debería desaparecer
3. La interfaz de contratos debería cargar correctamente

---

**¿Necesitas ayuda para crear el usuario?** Comparte el email del usuario y te ayudo a generar el SQL específico.

