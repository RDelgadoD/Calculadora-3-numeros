# ✅ Solución Final - Problemas de Vercel

## 🔍 Problemas Identificados y Corregidos

### Problema 1: Error en `/api/health` - Variables de Supabase
**Error:** `"SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados en el archivo .env"`

**Causa:** El `authMiddleware.js` estaba validando las variables de entorno sin usar los fallbacks a `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

**Solución:** ✅ Corregido - Ahora `authMiddleware.js` usa los mismos fallbacks que `supabase.js`.

### Problema 2: Error de conexión en "Gestión de Contratos"
**Error:** `"Error de conexión. No se pudo conectar a http://localhost:3001/api"`

**Causa:** `VITE_API_BASE_URL` no está configurada correctamente en Vercel o está usando el valor por defecto (`http://localhost:3001/api`).

**Solución:** ✅ Corregido - Mejorado el manejo de errores para detectar cuando está usando localhost en producción.

---

## 📋 Acción Requerida: Configurar `VITE_API_BASE_URL` en Vercel

### Paso 1: Verificar/Configurar `VITE_API_BASE_URL`

1. Ve a **Vercel** → Tu proyecto → **Settings** → **Environment Variables**
2. Busca la variable `VITE_API_BASE_URL`
3. **Verifica que el valor sea exactamente:**
   ```
   https://calculadora-3-numeros.vercel.app/api
   ```
   **IMPORTANTE:**
   - Sin espacios al inicio ni al final
   - Debe ser `https://` (no `http://`)
   - Debe terminar en `/api`
   - Debe usar tu dominio de Vercel (`calculadora-3-numeros.vercel.app`)

4. Si no existe o está mal configurada:
   - Haz clic en **"Add New"** o edita la existente
   - **Key:** `VITE_API_BASE_URL`
   - **Value:** `https://calculadora-3-numeros.vercel.app/api`
   - **Environments:** ✅ Production, ✅ Preview, ✅ Development
   - Haz clic en **"Save"**

### Paso 2: Verificar Todas las Variables de Entorno

Asegúrate de que estas variables estén configuradas correctamente:

#### Variables del Backend (sin prefijo `VITE_`):
- ✅ `SUPABASE_URL` - Tu URL de Supabase
- ✅ `SUPABASE_ANON_KEY` - Tu clave anónima de Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Tu clave de service role
- ✅ `OPENAI_API_KEY` - Tu clave de OpenAI
- ✅ `CORS_ORIGIN` - `https://calculadora-3-numeros.vercel.app` (sin espacios)

#### Variables del Frontend (con prefijo `VITE_`):
- ✅ `VITE_SUPABASE_URL` - Mismo valor que `SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY` - Mismo valor que `SUPABASE_ANON_KEY`
- ✅ `VITE_API_BASE_URL` - `https://calculadora-3-numeros.vercel.app/api` ⚠️ **CRÍTICA**

### Paso 3: Hacer Redeploy

**IMPORTANTE:** Después de cambiar `VITE_API_BASE_URL`, debes hacer un **nuevo deploy** porque las variables `VITE_*` se inyectan en tiempo de build.

1. Ve a **Deployments**
2. En el último deployment, haz clic en el menú "..." (tres puntos)
3. Selecciona **"Redeploy"**
4. Espera a que termine el deploy (puede tardar 2-5 minutos)

---

## ✅ Verificación Después del Redeploy

### 1. Probar el Endpoint `/api/health`

Visita: `https://calculadora-3-numeros.vercel.app/api/health`

**Deberías ver:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "version": "1.0.0"
}
```

**Si ves un error:**
- Revisa los **Function Logs** en Vercel
- Busca mensajes que empiecen con `🔍 Diagnóstico de variables de entorno:`
- Verifica qué variables están disponibles

### 2. Probar el Formulario de Contratos

1. Abre tu aplicación: `https://calculadora-3-numeros.vercel.app`
2. Inicia sesión
3. Haz clic en **"GESTIONAR CONTRATOS"** en el menú lateral
4. **Debería cargar correctamente** sin errores de conexión

**Si ves un error:**
- Abre la consola del navegador (F12)
- Busca mensajes que empiecen con `[API]`
- Verifica el mensaje de error específico

### 3. Revisar Function Logs en Vercel

1. Ve a **Deployments** → Último deployment → **Function Logs**
2. Busca:
   - `✅ Backend Express cargado correctamente`
   - `🔍 Diagnóstico de variables de entorno:`
   - Cualquier mensaje de error

---

## 🔧 Cambios Realizados en el Código

### 1. `backend/middleware/authMiddleware.js`
- ✅ Ahora usa fallbacks a `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- ✅ Mensajes de error más descriptivos
- ✅ Mejor diagnóstico de variables disponibles

### 2. `src/lib/apiClient.js`
- ✅ Detecta cuando `VITE_API_BASE_URL` está usando localhost en producción
- ✅ Mensajes de error más específicos y útiles
- ✅ Mejor logging para diagnóstico

### 3. `backend/services/openaiService.js`
- ✅ Inicialización lazy de OpenAI (solo cuando se necesita)
- ✅ No causa errores al importar el backend

### 4. `backend/controllers/chatController.js`
- ✅ Importación lazy de `openaiService` (solo cuando se usa el chat)

---

## 📝 Resumen de Variables Necesarias

```
# Backend (Funciones Serverless)
SUPABASE_URL=https://yzjoyujcfmmbiqrlgojq.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
OPENAI_API_KEY=sk-...
CORS_ORIGIN=https://calculadora-3-numeros.vercel.app

# Frontend (Build)
VITE_SUPABASE_URL=https://yzjoyujcfmmbiqrlgojq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_API_BASE_URL=https://calculadora-3-numeros.vercel.app/api  ⚠️ CRÍTICA
```

---

## ⚠️ Notas Importantes

1. **Variables `VITE_*` se inyectan en tiempo de build:**
   - Si cambias `VITE_API_BASE_URL`, debes hacer un **nuevo deploy**
   - No basta con cambiar la variable y esperar

2. **Variables sin `VITE_` están disponibles en runtime:**
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc. están disponibles cuando se ejecuta la función serverless
   - No necesitas redeploy después de cambiarlas (pero es recomendable)

3. **El código ahora usa fallbacks:**
   - Si `SUPABASE_URL` no está disponible, intenta usar `VITE_SUPABASE_URL`
   - Esto ayuda en casos donde las variables no están configuradas correctamente

---

## 🎯 Checklist Final

- [ ] `VITE_API_BASE_URL` configurada como `https://calculadora-3-numeros.vercel.app/api`
- [ ] Todas las variables de entorno configuradas (ver lista arriba)
- [ ] Todas las variables están en **Production**, **Preview**, y **Development**
- [ ] Redeploy realizado después de cambiar `VITE_API_BASE_URL`
- [ ] Endpoint `/api/health` funciona correctamente
- [ ] Formulario de contratos carga sin errores
- [ ] Function Logs muestran variables correctamente

---

## 🆘 Si Aún Hay Problemas

1. **Revisa los Function Logs en Vercel:**
   - Deployments → Último deployment → Function Logs
   - Busca mensajes de error o diagnóstico

2. **Revisa la consola del navegador:**
   - F12 → Console
   - Busca mensajes que empiecen con `[API]` o `❌`

3. **Verifica las variables de entorno:**
   - Settings → Environment Variables
   - Asegúrate de que no haya espacios al inicio/final
   - Verifica que estén en el entorno correcto (Production)

4. **Haz un redeploy completo:**
   - A veces Vercel necesita un redeploy completo para aplicar cambios

---

## ✅ Estado Actual

- ✅ Código corregido y subido a GitHub
- ✅ Manejo de errores mejorado
- ✅ Importaciones lazy implementadas
- ✅ Fallbacks a variables `VITE_*` implementados
- ⚠️ **Pendiente:** Configurar `VITE_API_BASE_URL` en Vercel y hacer redeploy

---

**Una vez que configures `VITE_API_BASE_URL` y hagas el redeploy, todo debería funcionar correctamente.**

