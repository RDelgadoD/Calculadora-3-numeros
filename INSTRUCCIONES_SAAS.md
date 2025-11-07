# 📚 Instrucciones para Configurar el Sistema SaaS Multi-Tenant

## 🎯 Sistema Multi-Tenant Implementado

Tu aplicación ahora es un **Software as a Service (SaaS)** donde:
- Cada cliente tiene múltiples usuarios
- Los usuarios solo ven información de su cliente
- Al iniciar sesión, se muestra: "Bienvenido [Nombre], Entidad: [Nombre Cliente]"
- Los administradores pueden gestionar clientes y usuarios

## 📋 Pasos para Configurar

### Paso 1: Ejecutar Script SQL de SaaS

1. Ve a Supabase > **SQL Editor**
2. Abre el archivo `supabase-saas-setup.sql`
3. Copia y pega todo el contenido
4. Ejecuta el script (Run o Ctrl+Enter)

Este script creará:
- Tabla `clientes` (para tus clientes/entidades)
- Tabla `usuarios` (extiende auth.users con información adicional)
- Actualiza tabla `calculos` con `cliente_id`
- Configura políticas de seguridad (RLS)

### Paso 2: Crear tu Primer Cliente

**Opción A: Desde Supabase Table Editor**
1. Ve a Supabase > **Table Editor**
2. Selecciona la tabla `clientes`
3. Haz clic en "Insert row"
4. Agrega un nombre (ej: "Empresa ABC")
5. Guarda

**Opción B: Desde la Aplicación (si eres admin)**
1. Inicia sesión como administrador
2. Ve al menú **"⚙️ Administración"**
3. Crea tu primer cliente

### Paso 3: Crear tu Primer Usuario del Sistema

**IMPORTANTE**: Los usuarios deben crearse de forma especial porque necesitan:
1. Un registro en `auth.users` (autenticación)
2. Un registro en `usuarios` (información del sistema)

**Opción A: Desde la Aplicación (Recomendado)**
1. Inicia sesión como administrador
2. Ve a **"⚙️ Administración" > Tab "Usuarios"**
3. Completa el formulario:
   - Nombre Completo: Ej: "Pedro Pérez"
   - Email: pedro@email.com
   - Contraseña: (mínimo 6 caracteres)
   - Cliente: Selecciona el cliente creado
   - Rol: Selecciona "Administrador" o "Usuario"
4. Haz clic en "Crear Usuario"

**Opción B: Manualmente desde Supabase**

1. **Crear usuario en auth.users:**
   - Ve a Supabase > **Authentication > Users**
   - Haz clic en "Add user"
   - Ingresa email y contraseña
   - Haz clic en "Create user"

2. **Crear registro en tabla usuarios:**
   - Ve a **Table Editor > usuarios**
   - Haz clic en "Insert row"
   - Completa:
     - `id`: Copia el UUID del usuario creado en auth.users
     - `email`: El email del usuario
     - `nombre_completo`: Ej: "Pedro Pérez"
     - `cliente_id`: Selecciona el ID del cliente creado
     - `rol`: "admin" o "usuario"
     - `activo`: true
   - Guarda

### Paso 4: Verificar que Funciona

1. Inicia sesión con el usuario creado
2. Deberías ver:
   - **Mensaje de bienvenida**: "Bienvenido Pedro Pérez"
   - **Entidad**: "Empresa ABC"
3. Verifica que:
   - La calculadora guarda cálculos
   - La consulta solo muestra operaciones del mismo cliente

## 🔐 Roles del Sistema

- **Admin**: Puede acceder a "Administración" para crear clientes y usuarios
- **Usuario**: Acceso normal, solo ve información de su cliente

## 🏢 Estructura Multi-Tenant

```
Sistema SaaS
├── Cliente 1 (Empresa ABC)
│   ├── Usuario 1 (Pedro Pérez)
│   ├── Usuario 2 (María García)
│   └── Cálculos solo de estos usuarios
│
├── Cliente 2 (Empresa XYZ)
│   ├── Usuario 3 (Juan López)
│   └── Cálculos solo de este usuario
│
└── ...
```

## ✅ Características Implementadas

1. **Aislamiento de Datos**: Cada cliente solo ve sus propios datos
2. **Mensaje Personalizado**: "Bienvenido [Nombre], Entidad: [Cliente]"
3. **Gestión de Clientes**: Crear y ver clientes
4. **Gestión de Usuarios**: Crear usuarios asociados a clientes
5. **Consultas Filtradas**: Solo muestra usuarios y operaciones del mismo cliente
6. **Políticas de Seguridad**: RLS en Supabase protege los datos

## 🚨 Importante

- Los usuarios deben tener un registro tanto en `auth.users` como en `usuarios`
- El campo `id` en `usuarios` DEBE ser el mismo que en `auth.users`
- Todos los cálculos se asocian automáticamente al cliente del usuario

## 📝 Notas

- El componente de Administración solo es visible para usuarios con `rol = 'admin'`
- Los usuarios nuevos recibirán un email de confirmación (si está configurado en Supabase)
- Puedes desactivar usuarios cambiando `activo = false` en la tabla `usuarios`

