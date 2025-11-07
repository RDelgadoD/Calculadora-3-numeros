# 📋 Pasos Completos para Crear Cliente y Admin

## Información del Sistema:
- **Cliente**: OT Piendamo
- **Email Admin**: ronhalddelgado@gmail.com
- **Nombre Admin**: Lina Baastidas

## ✅ Paso a Paso:

### Paso 1: Ejecutar Script SaaS (Si aún no lo hiciste)

1. Ve a Supabase > **SQL Editor**
2. Abre `supabase-saas-setup.sql`
3. Copia todo el contenido y ejecuta
4. Verifica que no haya errores

### Paso 2: Crear Cliente "OT Piendamo"

1. Ve a Supabase > **SQL Editor**
2. Abre el archivo `crear-cliente-ot-piendamo.sql`
3. Copia y ejecuta el script
4. **IMPORTANTE**: Copia el **ID** que aparece (será un UUID)
   - Ejemplo: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

### Paso 3: Crear Usuario en Authentication

1. Ve a Supabase > **Authentication** > **Users**
2. Haz clic en **"Add user"** (botón verde)
3. Completa:
   - **Email**: `ronhalddelgado@gmail.com`
   - **Password**: (elige una contraseña segura, mínimo 6 caracteres)
   - **Auto Confirm User**: ✅ Marca esta casilla
4. Haz clic en **"Create user"**
5. **IMPORTANTE**: Copia el **UUID** del usuario creado
   - Aparece en la lista de usuarios (columna UUID)
   - O haz clic en el usuario para ver sus detalles

### Paso 4: Crear Registro Admin en Tabla Usuarios

1. Ve a Supabase > **SQL Editor**
2. Abre el archivo `crear-admin-lina.sql`
3. Reemplaza los dos valores:
   - `UUID_DEL_USUARIO_AUTH` → Pega el UUID del Paso 3
   - `UUID_DEL_CLIENTE` → Pega el ID del cliente del Paso 2
4. Ejecuta el script

**Ejemplo de cómo debería verse (con UUIDs de ejemplo):**

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
  '12345678-1234-1234-1234-123456789012'::uuid,  -- UUID del usuario auth
  'ronhalddelgado@gmail.com',
  'Lina Baastidas',
  '87654321-4321-4321-4321-210987654321'::uuid,  -- ID del cliente
  'admin',
  true
);
```

### Paso 5: Verificar

1. Recarga tu aplicación
2. Inicia sesión con:
   - **Email**: ronhalddelgado@gmail.com
   - **Password**: La que elegiste en el Paso 3
3. Deberías ver:
   - ✅ "Bienvenido Lina Baastidas"
   - ✅ "Entidad: OT Piendamo"
   - ✅ Menú "⚙️ Administración" visible

## 🆘 Si hay Problemas

### No puedo ver el UUID del usuario
- Haz clic en el usuario en la lista
- El UUID aparece en la parte superior o en los detalles

### No puedo ver el ID del cliente
- Ve a Table Editor > clientes
- El ID aparece en la primera columna
- O ejecuta: `SELECT id, nombre FROM clientes;`

### Error al ejecutar el INSERT en usuarios
- Verifica que los UUIDs sean correctos
- Verifica que el cliente existe: `SELECT * FROM clientes WHERE nombre = 'OT Piendamo';`
- Verifica que el usuario existe en auth.users

