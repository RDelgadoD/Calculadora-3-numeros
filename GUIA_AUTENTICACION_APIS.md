# 🔐 Guía: Autenticación en APIs - Arquitectura del Proyecto

## 📋 Resumen de la Arquitectura Actual

### ✅ Lo que SÍ tienes:
- **Frontend**: React + Vite (SPA - Single Page Application)
- **Backend**: Supabase (BaaS - Backend as a Service)
- **Cliente Supabase JS**: `@supabase/supabase-js` desde el frontend
- **Autenticación**: Supabase Auth con JWT automático

### ❌ Lo que NO tienes:
- **Express.js**: No hay servidor Node.js propio
- **ORM**: No se usa Sequelize ni Prisma
- **APIs propias**: Todo se hace directamente desde el frontend

---

## 🔍 Cómo Funciona la Autenticación Actual

### 1. **Autenticación desde el Frontend**

El cliente Supabase JS maneja automáticamente los JWT:

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
// ✅ Este cliente automáticamente:
// - Guarda el JWT en localStorage
// - Lo envía en cada request a Supabase
// - Lo renueva cuando expira
```

### 2. **RLS (Row Level Security) en Supabase**

Las políticas RLS en Supabase validan automáticamente el JWT:

```sql
-- Ejemplo de política RLS
CREATE POLICY calculos_select_cliente
  ON calculos
  FOR SELECT
  TO authenticated
  USING (
    cliente_id = fn_get_user_cliente_id(auth.uid())
  );
```

**✅ Ventaja**: La seguridad está en la base de datos, no en el código del frontend.

---

## 🚨 Problema Actual: Funciones que Requieren `service_role`

Algunas operaciones (como `fn_admin_update_user`) requieren permisos de `service_role` que el cliente anon no tiene.

### ❌ Esto NO funciona desde el frontend:

```javascript
// ❌ Esto falla porque requiere service_role
const { error } = await supabase.rpc('fn_admin_update_user', {
  target_user: userId,
  new_email: newEmail
})
```

### ✅ Soluciones: 3 Opciones

---

## 🎯 Opción 1: Supabase Edge Functions (RECOMENDADO)

### ✅ Ventajas:
- ✅ Integrado con Supabase
- ✅ Acceso directo a la BD con `service_role`
- ✅ Autenticación JWT nativa
- ✅ Serverless (sin servidor que mantener)
- ✅ Escalable automáticamente

### 📁 Estructura:

```
supabase/
  functions/
    admin-update-user/
      index.ts
```

### 🔧 Implementación:

**1. Crear la función Edge:**

Ya está creada en: `supabase/functions/admin-update-user/index.ts`

**2. Instalar Supabase CLI:**

```bash
npm install -g supabase
```

**3. Login en Supabase:**

```bash
supabase login
```

**4. Link al proyecto:**

```bash
supabase link --project-ref tu-project-ref
```

**5. Deploy de la función:**

```bash
supabase functions deploy admin-update-user
```

**6. Usar desde el frontend:**

```javascript
// src/components/Admin.jsx
const actualizarUsuario = async (targetUserId, newEmail, newPassword) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('No hay sesión activa')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        targetUserId,
        newEmail,
        newPassword
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error)
  }

  return await response.json()
}
```

---

## 🎯 Opción 2: Express.js (Backend Propio)

### ✅ Ventajas:
- ✅ Control total del servidor
- ✅ Puedes agregar lógica compleja
- ✅ Ideal para integraciones con otros servicios

### ❌ Desventajas:
- ❌ Necesitas mantener un servidor
- ❌ Costos de hosting adicionales
- ❌ Más complejidad

### 📁 Estructura:

```
server-example/
  index.js
  package.json
```

### 🔧 Implementación:

**1. Instalar dependencias:**

```bash
cd server-example
npm init -y
npm install express @supabase/supabase-js cors dotenv
```

**2. Crear `.env`:**

```env
SUPABASE_URL=tu_url
SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
PORT=3001
```

**3. Ejecutar servidor:**

```bash
node index.js
```

**4. Usar desde el frontend:**

```javascript
const actualizarUsuario = async (targetUserId, newEmail, newPassword) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch('http://localhost:3001/api/admin/update-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      targetUserId,
      newEmail,
      newPassword
    })
  })

  return await response.json()
}
```

---

## 🎯 Opción 3: Vercel Serverless Functions

### ✅ Ventajas:
- ✅ Sin servidor que mantener
- ✅ Integrado con Vercel (donde ya tienes el frontend)
- ✅ Serverless (paga por uso)
- ✅ Escalable automáticamente

### 📁 Estructura:

```
api/
  admin/
    update-user.js
```

### 🔧 Implementación:

**1. Crear la función:**

Ya está creada en: `api/admin/update-user.js`

**2. Agregar variables de entorno en Vercel:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ← **NUEVA**

**3. Usar desde el frontend:**

```javascript
const actualizarUsuario = async (targetUserId, newEmail, newPassword) => {
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch('/api/admin/update-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      targetUserId,
      newEmail,
      newPassword
    })
  })

  return await response.json()
}
```

---

## 🔐 Cómo Validar JWT de Supabase en APIs

### Patrón común (usado en las 3 opciones):

```javascript
// 1. Obtener token del header
const authHeader = req.headers.authorization
const token = authHeader.split(' ')[1] // "Bearer <token>"

// 2. Crear cliente Supabase con anon key
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: { Authorization: `Bearer ${token}` }
  }
})

// 3. Verificar el token
const { data: { user }, error } = await supabaseClient.auth.getUser()

if (error || !user) {
  return res.status(401).json({ error: 'Invalid token' })
}

// 4. Verificar rol (opcional)
const { data: userData } = await supabaseAdmin
  .from('usuarios')
  .select('rol')
  .eq('id', user.id)
  .single()

if (userData?.rol !== 'admin') {
  return res.status(403).json({ error: 'Admin required' })
}

// 5. Usar service_role para operaciones privilegiadas
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
await supabaseAdmin.rpc('fn_admin_update_user', { ... })
```

---

## 📊 Comparación de Opciones

| Característica | Edge Functions | Express.js | Vercel Functions |
|----------------|----------------|------------|------------------|
| **Complejidad** | ⭐⭐ Baja | ⭐⭐⭐⭐ Alta | ⭐⭐⭐ Media |
| **Costo** | ✅ Gratis (límites) | ❌ Hosting | ✅ Gratis (límites) |
| **Mantenimiento** | ✅ Cero | ❌ Alto | ✅ Bajo |
| **Escalabilidad** | ✅ Automática | ⚠️ Manual | ✅ Automática |
| **Integración Supabase** | ✅✅✅ Excelente | ⚠️ Manual | ⚠️ Manual |
| **Recomendado para** | ✅ Este proyecto | Backend complejo | Ya en Vercel |

---

## 🎯 Recomendación para tu Proyecto

### **Opción 1: Supabase Edge Functions** ⭐

**Razones:**
1. Ya usas Supabase, es la opción más integrada
2. No necesitas mantener servidores
3. Autenticación JWT nativa
4. Escalable automáticamente
5. Gratis hasta cierto límite

### Pasos para implementar:

1. ✅ Función ya creada: `supabase/functions/admin-update-user/index.ts`
2. Instalar Supabase CLI: `npm install -g supabase`
3. Deploy: `supabase functions deploy admin-update-user`
4. Actualizar `Admin.jsx` para usar la función Edge

---

## 📝 Variables de Entorno Necesarias

### Para Edge Functions (Supabase Dashboard):
- `SUPABASE_URL` (automático)
- `SUPABASE_ANON_KEY` (automático)
- `SUPABASE_SERVICE_ROLE_KEY` (agregar manualmente)

### Para Vercel Functions:
- `VITE_SUPABASE_URL` (ya existe)
- `VITE_SUPABASE_ANON_KEY` (ya existe)
- `SUPABASE_SERVICE_ROLE_KEY` (agregar nueva)

---

## ✅ Checklist de Implementación

- [ ] Elegir opción (recomendado: Edge Functions)
- [ ] Instalar herramientas necesarias
- [ ] Configurar variables de entorno
- [ ] Deploy de la función/API
- [ ] Actualizar `Admin.jsx` para usar la nueva API
- [ ] Probar actualización de usuarios
- [ ] Verificar que el JWT se valida correctamente

---

## 🔗 Recursos

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Supabase Auth JWT](https://supabase.com/docs/guides/auth)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Express.js + Supabase](https://supabase.com/docs/guides/integrations/express)


