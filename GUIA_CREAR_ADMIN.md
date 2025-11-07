# 🚀 Guía: Crear Primer Cliente y Usuario Administrador

## 📋 Pasos Detallados

### Paso 1: Ejecutar el Script SQL de SaaS (Si aún no lo hiciste)

1. Ve a Supabase > **SQL Editor**
2. Abre `supabase-saas-setup.sql`
3. Copia todo el contenido
4. Pégalo en el SQL Editor
5. Haz clic en **Run** o presiona **Ctrl+Enter**

### Paso 2: Crear el Primer Cliente

**Opción A: Desde SQL (Rápido)**

1. Ve a Supabase > **SQL Editor**
2. Ejecuta este SQL (reemplaza "Mi Empresa" con el nombre de tu cliente):

```sql
INSERT INTO clientes (nombre, activo)
VALUES ('Mi Empresa', true)
RETURNING id, nombre;
```

3. **IMPORTANTE**: Copia el `id` que se muestra (será un UUID como: `123e4567-e89b-12d3-a456-426614174000`)

**Opción B: Desde Table Editor (Visual)**

1. Ve a Supabase > **Table Editor**
2. Selecciona la tabla `clientes`
3. Haz clic en **"Insert row"** (botón verde)
4. Completa:
   - `nombre`: Ej: "Mi Empresa"
   - `activo`: true (marca la casilla)
5. Haz clic en **Save**
6. **IMPORTANTE**: Copia el `id` del cliente creado (primer columna)

### Paso 3: Crear Usuario en Authentication

1. Ve a Supabase > **Authentication** > **Users**
2. Haz clic en **"Add user"** (botón verde en la parte superior)
3. Completa:
   - **Email**: admin@tudominio.com (o el email que prefieras)
   - **Password**: (elige una contraseña segura, mínimo 6 caracteres)
   - **Auto Confirm User**: ✅ Marca esta casilla (para que no necesite confirmar email)
4. Haz clic en **"Create user"**
5. **IMPORTANTE**: Copia el **UUID** del usuario creado
   - Lo encontrarás en la columna "UUID" o haciendo clic en el usuario

### Paso 4: Crear Registro en Tabla Usuarios

1. Ve a Supabase > **SQL Editor**
2. Ejecuta este SQL (reemplaza los valores marcados):

```sql
INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  cliente_id,
  rol,
  activo
)
VALUES (
  'PEGA_AQUI_EL_UUID_DEL_USUARIO'::uuid,  -- UUID del Paso 3
  'admin@tudominio.com',                   -- Email del usuario
  'Tu Nombre Completo',                    -- Tu nombre
  'PEGA_AQUI_EL_ID_DEL_CLIENTE'::uuid,    -- ID del cliente del Paso 2
  'admin',                                 -- Rol: admin
  true                                     -- Activo: true
);
```

**Ejemplo con valores reales:**

```sql
INSERT INTO usuarios (
  id,
  email,
  nombre_completo,
  cliente_id,
  rol,
  activo
)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'ronhalddelgado@gmail.com',
  'Ronhal Delgado',
  '12345678-1234-1234-1234-123456789012'::uuid,
  'admin',
  true
);
```

3. Haz clic en **Run**

### Paso 5: Verificar que Funcionó

1. Recarga tu aplicación (o cierra sesión si estabas logueado)
2. Inicia sesión con:
   - **Email**: El que creaste en el Paso 3
   - **Password**: La contraseña que elegiste
3. Deberías ver:
   - ✅ "Bienvenido [Tu Nombre]"
   - ✅ "Entidad: [Nombre del Cliente]"
   - ✅ Opción "⚙️ Administración" en el menú lateral

## ✅ Checklist

- [ ] Script `supabase-saas-setup.sql` ejecutado
- [ ] Cliente creado (Paso 2)
- [ ] ID del cliente copiado
- [ ] Usuario creado en Authentication (Paso 3)
- [ ] UUID del usuario copiado
- [ ] Registro creado en tabla `usuarios` (Paso 4)
- [ ] Inicio de sesión exitoso
- [ ] Mensaje de bienvenida visible
- [ ] Menú de Administración visible

## 🆘 Solución de Problemas

### Error: "relation 'clientes' does not exist"
- Ejecuta primero `supabase-saas-setup.sql`

### Error: "insert or update on table 'usuarios' violates foreign key constraint"
- Verifica que el UUID del usuario en auth.users sea correcto
- Verifica que el UUID del cliente sea correcto

### No veo el menú de Administración
- Verifica que el campo `rol` sea exactamente `'admin'` (en minúsculas)
- Verifica que `activo` sea `true`
- Cierra sesión y vuelve a iniciar sesión

### El mensaje de bienvenida no muestra mi nombre
- Verifica que `nombre_completo` esté correctamente escrito en la tabla `usuarios`
- Verifica que el `id` en `usuarios` coincida exactamente con el UUID de `auth.users`

---

**¿Necesitas ayuda con algún paso? Avísame y te guío.**

