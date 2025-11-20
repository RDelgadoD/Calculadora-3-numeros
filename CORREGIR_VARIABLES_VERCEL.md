# 🔧 Corrección de Variables de Entorno en Vercel

## ⚠️ Problema Identificado

El error indica que las variables de entorno no se están leyendo correctamente. Además, el valor de `CORS_ORIGIN` tiene un **espacio al inicio**, lo cual causa problemas.

## ✅ Solución: Corregir Variables de Entorno

### Paso 1: Corregir `CORS_ORIGIN`

1. Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**
2. Busca la variable `CORS_ORIGIN`
3. **Edita** el valor y asegúrate de que sea exactamente:
   ```
   https://calculadora-3-numeros.vercel.app
   ```
   **IMPORTANTE**: Sin espacios al inicio ni al final.

4. Si tienes múltiples orígenes, sepáralos con comas (sin espacios):
   ```
   https://calculadora-3-numeros.vercel.app,https://otro-dominio.com
   ```

### Paso 2: Verificar Todas las Variables de Entorno

Asegúrate de que estas variables estén configuradas correctamente:

#### Variables del Backend (sin prefijo VITE_)
- ✅ `SUPABASE_URL` - Tu URL de Supabase (ej: `https://xxxxx.supabase.co`)
- ✅ `SUPABASE_ANON_KEY` - Tu clave anónima de Supabase
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Tu clave de service role de Supabase
- ✅ `OPENAI_API_KEY` - Tu clave de API de OpenAI
- ✅ `CORS_ORIGIN` - `https://calculadora-3-numeros.vercel.app` (sin espacios)

#### Variables del Frontend (con prefijo VITE_)
- ✅ `VITE_SUPABASE_URL` - Mismo valor que `SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY` - Mismo valor que `SUPABASE_ANON_KEY`
- ✅ `VITE_API_BASE_URL` - `https://calculadora-3-numeros.vercel.app/api`

### Paso 3: Verificar que las Variables Estén en Todos los Entornos

Para cada variable, asegúrate de que esté seleccionada en:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development** (opcional)

### Paso 4: Hacer Redeploy

Después de corregir las variables:

1. Ve a **Deployments**
2. En el último deployment, haz clic en el menú "..." (tres puntos)
3. Selecciona **"Redeploy"**
4. Espera a que termine el deploy

## 🔍 Cómo Verificar que las Variables Están Correctas

### Verificar en Vercel:
1. Ve a **Settings** → **Environment Variables**
2. Para cada variable, haz clic en el ícono del ojo 👁️ para ver el valor
3. Verifica que no haya espacios al inicio o al final

### Verificar en los Logs:
1. Ve a **Deployments** → Último deployment → **Function Logs**
2. Busca mensajes que indiquen qué variables están disponibles
3. Si ves errores sobre variables faltantes, verifica que estén configuradas

## 📝 Valores Correctos de Ejemplo

```
CORS_ORIGIN=https://calculadora-3-numeros.vercel.app
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-...
VITE_API_BASE_URL=https://calculadora-3-numeros.vercel.app/api
```

## ⚠️ Errores Comunes

1. **Espacios al inicio/final**: ` https://...` ❌ → `https://...` ✅
2. **Comillas innecesarias**: `"https://..."` ❌ → `https://...` ✅
3. **Variables en el entorno incorrecto**: Asegúrate de seleccionar Production
4. **Variables con prefijo incorrecto**: Backend usa `SUPABASE_URL`, frontend usa `VITE_SUPABASE_URL`

## 🎯 Después de Corregir

1. Haz un **Redeploy**
2. Prueba el endpoint: `https://calculadora-3-numeros.vercel.app/api/health`
3. Deberías ver: `{"status":"ok","timestamp":"...","version":"1.0.0"}`
4. Prueba el formulario de contratos - debería funcionar correctamente

