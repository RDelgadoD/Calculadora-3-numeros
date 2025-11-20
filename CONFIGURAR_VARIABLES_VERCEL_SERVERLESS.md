# 🔧 Configurar Variables de Entorno para Funciones Serverless en Vercel

## ⚠️ Problema Común

En Vercel, las variables de entorno con prefijo `VITE_` están disponibles **solo durante el build del frontend**, pero **NO están disponibles en el runtime de las funciones serverless** (backend).

Por eso, aunque veas `VITE_SUPABASE_URL` configurada, el backend no puede acceder a ella porque necesita `SUPABASE_URL` (sin el prefijo `VITE_`).

## ✅ Solución: Configurar Variables para Funciones Serverless

### Variables Necesarias para el Backend (SIN prefijo VITE_)

Estas variables deben estar configuradas **sin el prefijo `VITE_`** para que estén disponibles en las funciones serverless:

1. **`SUPABASE_URL`** ⚠️ **CRÍTICA** - Tu URL de Supabase
   - Valor: `https://yzjoyujcfmmbiqrlgojq.supabase.co` (tu URL real)
   - **DEBE estar configurada SIN el prefijo `VITE_`**

2. **`SUPABASE_ANON_KEY`** - Tu clave anónima de Supabase
   - Valor: Tu clave anónima completa
   - **DEBE estar configurada SIN el prefijo `VITE_`**

3. **`SUPABASE_SERVICE_ROLE_KEY`** - Tu clave de service role
   - Valor: Tu clave de service role completa
   - Ya la tienes configurada ✅

4. **`OPENAI_API_KEY`** - Tu clave de OpenAI
   - Valor: Tu clave de OpenAI
   - Ya la tienes configurada ✅

5. **`CORS_ORIGIN`** - Origen permitido para CORS
   - Valor: `https://calculadora-3-numeros.vercel.app` (sin espacios)
   - Ya la tienes configurada ✅

### Variables para el Frontend (CON prefijo VITE_)

Estas variables se usan durante el build del frontend:

1. **`VITE_SUPABASE_URL`** - URL de Supabase para el frontend
2. **`VITE_SUPABASE_ANON_KEY`** - Clave anónima para el frontend
3. **`VITE_API_BASE_URL`** - URL base de la API

## 📋 Pasos para Corregir

### Paso 1: Agregar `SUPABASE_URL` (sin prefijo VITE_)

1. Ve a Vercel → Tu proyecto → **Settings** → **Environment Variables**
2. Haz clic en **"Add New"** o busca si ya existe `SUPABASE_URL`
3. Configura:
   - **Key**: `SUPABASE_URL` (sin `VITE_`)
   - **Value**: `https://yzjoyujcfmmbiqrlgojq.supabase.co` (tu URL real)
   - **Environments**: Selecciona ✅ **Production**, ✅ **Preview**, ✅ **Development**
4. Haz clic en **"Save"**

### Paso 2: Agregar `SUPABASE_ANON_KEY` (sin prefijo VITE_)

1. Haz clic en **"Add New"**
2. Configura:
   - **Key**: `SUPABASE_ANON_KEY` (sin `VITE_`)
   - **Value**: Tu clave anónima completa (la misma que `VITE_SUPABASE_ANON_KEY`)
   - **Environments**: Selecciona ✅ **Production**, ✅ **Preview**, ✅ **Development**
3. Haz clic en **"Save"**

### Paso 3: Verificar Todas las Variables

Asegúrate de tener **AMBAS** versiones de las variables:

#### Variables para Backend (Funciones Serverless):
- ✅ `SUPABASE_URL` (sin `VITE_`)
- ✅ `SUPABASE_ANON_KEY` (sin `VITE_`)
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `OPENAI_API_KEY`
- ✅ `CORS_ORIGIN`

#### Variables para Frontend (Build):
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `VITE_API_BASE_URL`

### Paso 4: Hacer Redeploy

Después de agregar las variables:

1. Ve a **Deployments**
2. En el último deployment, haz clic en el menú "..." (tres puntos)
3. Selecciona **"Redeploy"**
4. Espera a que termine el deploy

## 🔍 Cómo Verificar que Funciona

### 1. Verificar el Endpoint Health

Visita: `https://calculadora-3-numeros.vercel.app/api/health`

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX...",
  "version": "1.0.0"
}
```

### 2. Verificar los Function Logs

1. Ve a **Deployments** → Último deployment → **Function Logs**
2. Busca mensajes que empiecen con `🔍 Diagnóstico de variables de entorno:`
3. Deberías ver:
   ```
   🔍 Diagnóstico de variables de entorno:
     SUPABASE_URL: ✅
     VITE_SUPABASE_URL: ✅
     SUPABASE_SERVICE_ROLE_KEY: ✅
     SUPABASE_ANON_KEY: ✅
     VITE_SUPABASE_ANON_KEY: ✅
   ```

## ⚠️ Nota Importante

**En Vercel, las variables de entorno funcionan de manera diferente:**

- **Variables con `VITE_`**: Solo disponibles durante el **build** del frontend
- **Variables sin `VITE_`**: Disponibles en el **runtime** de las funciones serverless

Por eso necesitas **AMBAS** versiones:
- `VITE_SUPABASE_URL` → Para el frontend (build time)
- `SUPABASE_URL` → Para el backend (runtime)

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
VITE_API_BASE_URL=https://calculadora-3-numeros.vercel.app/api
```

## ✅ Checklist

- [ ] `SUPABASE_URL` configurada (sin `VITE_`)
- [ ] `SUPABASE_ANON_KEY` configurada (sin `VITE_`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada
- [ ] `OPENAI_API_KEY` configurada
- [ ] `CORS_ORIGIN` configurada (sin espacios)
- [ ] `VITE_SUPABASE_URL` configurada
- [ ] `VITE_SUPABASE_ANON_KEY` configurada
- [ ] `VITE_API_BASE_URL` configurada
- [ ] Todas las variables están en **Production**, **Preview**, y **Development**
- [ ] Redeploy realizado
- [ ] Endpoint `/api/health` funciona correctamente

