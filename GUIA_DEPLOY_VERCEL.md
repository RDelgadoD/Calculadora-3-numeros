# 🚀 Guía Completa de Despliegue en Vercel

Esta guía te ayudará a desplegar tu aplicación completa (frontend + backend) en Vercel.

## 📋 Prerrequisitos

1. ✅ Cuenta en [Vercel](https://vercel.com) (puedes crear una con GitHub)
2. ✅ Repositorio en GitHub con todos los cambios confirmados
3. ✅ Variables de entorno listas (Supabase y OpenAI)

---

## 🔧 Paso 1: Preparar el Proyecto

### 1.1 Verificar estructura del proyecto

Asegúrate de que tu proyecto tenga esta estructura:
```
tu-proyecto/
├── src/              # Frontend React
├── backend/           # Backend Express
├── api/              # Wrapper para Vercel
├── package.json      # Frontend
├── backend/package.json  # Backend
└── vercel.json       # Configuración de Vercel
```

### 1.2 Instalar dependencias del backend en la raíz (opcional pero recomendado)

Vercel necesita acceso a las dependencias del backend. Puedes:
- **Opción A**: Instalar dependencias del backend en la raíz
- **Opción B**: Configurar Vercel para instalar desde `backend/`

---

## 🌐 Paso 2: Conectar con Vercel

### 2.1 Iniciar sesión en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Haz clic en **"Add New Project"** o **"Import Project"**

### 2.2 Importar el repositorio

1. Selecciona tu repositorio de GitHub: `RDelgadoD/Calculadora-3-numeros`
2. Vercel detectará automáticamente que es un proyecto Vite/React

---

## ⚙️ Paso 3: Configurar el Proyecto en Vercel

### 3.1 Configuración del Framework Preset

- **Framework Preset**: `Vite`
- **Root Directory**: `./` (raíz del proyecto)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3.2 Configuración Avanzada (opcional)

Si necesitas instalar dependencias del backend también, puedes agregar en **"Install Command"**:
```bash
npm install && cd backend && npm install && cd ..
```

---

## 🔐 Paso 4: Configurar Variables de Entorno

### 4.1 Variables para el Frontend (VITE_*)

En la sección **"Environment Variables"** de Vercel, agrega:

#### Variables de Supabase (Frontend)
```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
VITE_API_BASE_URL=https://tu-proyecto.vercel.app/api
```

**Nota**: `VITE_API_BASE_URL` debe apuntar a tu URL de Vercel. Puedes actualizarla después del primer deploy.

### 4.2 Variables para el Backend (API)

#### Variables de Supabase (Backend)
```
SUPABASE_URL=tu_url_de_supabase
SUPABASE_ANON_KEY=tu_anon_key_de_supabase
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_de_supabase
```

#### Variable de OpenAI
```
OPENAI_API_KEY=sk-tu_clave_api_de_openai
```

#### Variable de CORS (opcional)
```
CORS_ORIGIN=https://tu-proyecto.vercel.app
```

### 4.3 Cómo agregar variables en Vercel

1. En la configuración del proyecto, ve a **"Settings"** → **"Environment Variables"**
2. Haz clic en **"Add New"**
3. Ingresa el **Name** y **Value**
4. Selecciona los **Environments** donde aplicará:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (opcional)
5. Haz clic en **"Save"**

---

## 🚀 Paso 5: Realizar el Deploy

### 5.1 Primer Deploy

1. Haz clic en **"Deploy"**
2. Vercel comenzará a construir tu proyecto
3. Espera a que termine el proceso (puede tardar 2-5 minutos)

### 5.2 Verificar el Deploy

Una vez completado, verás:
- ✅ URL de producción: `https://tu-proyecto.vercel.app`
- ✅ Estado del build (éxito o error)

---

## 🔄 Paso 6: Actualizar Variables de Entorno Después del Primer Deploy

### 6.1 Actualizar VITE_API_BASE_URL

Después del primer deploy, necesitas actualizar `VITE_API_BASE_URL`:

1. Ve a **Settings** → **Environment Variables**
2. Edita `VITE_API_BASE_URL`
3. Cambia el valor a: `https://tu-proyecto.vercel.app/api`
4. Guarda los cambios
5. Haz un **Redeploy** desde la pestaña **"Deployments"**

---

## 🧪 Paso 7: Probar la Aplicación

### 7.1 Probar el Frontend

1. Visita tu URL de Vercel: `https://tu-proyecto.vercel.app`
2. Verifica que la aplicación carga correctamente
3. Prueba iniciar sesión

### 7.2 Probar el Backend API

1. Visita: `https://tu-proyecto.vercel.app/api/health`
2. Deberías ver: `{"status":"ok","timestamp":"...","version":"1.0.0"}`

### 7.3 Verificar Logs

Si hay errores:
1. Ve a la pestaña **"Deployments"**
2. Haz clic en el último deployment
3. Revisa los **"Function Logs"** para ver errores

---

## 🐛 Solución de Problemas Comunes

### Error: "Module not found"

**Solución**: Asegúrate de que todas las dependencias estén en `package.json` de la raíz o configura Vercel para instalar desde `backend/`.

### Error: "CORS policy"

**Solución**: 
1. Verifica que `CORS_ORIGIN` incluya tu URL de Vercel
2. O deja que el código detecte automáticamente `VERCEL_URL`

### Error: "OPENAI_API_KEY is not defined"

**Solución**: 
1. Verifica que agregaste la variable en Vercel
2. Asegúrate de seleccionar el environment correcto (Production)
3. Haz un redeploy después de agregar variables

### Error: "Cannot find module"

**Solución**: Verifica que el archivo `api/index.js` existe y exporta correctamente el app de Express.

---

## 📝 Resumen de Variables de Entorno Necesarias

### Frontend (VITE_*)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_BASE_URL
```

### Backend
```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
CORS_ORIGIN (opcional, se detecta automáticamente)
```

---

## 🔗 URLs Importantes

- **Dashboard de Vercel**: https://vercel.com/dashboard
- **Documentación de Vercel**: https://vercel.com/docs
- **Variables de Entorno en Vercel**: https://vercel.com/docs/concepts/projects/environment-variables

---

## ✅ Checklist Final

- [ ] Repositorio conectado a Vercel
- [ ] Variables de entorno configuradas
- [ ] Primer deploy completado
- [ ] `VITE_API_BASE_URL` actualizado con la URL de Vercel
- [ ] Redeploy realizado
- [ ] Frontend funciona correctamente
- [ ] Backend API responde en `/api/health`
- [ ] Chat funciona (requiere OpenAI API Key)
- [ ] Autenticación funciona (requiere Supabase)

---

## 🎉 ¡Listo!

Tu aplicación debería estar funcionando en Vercel. Cada push a `main` desplegará automáticamente una nueva versión.

**Nota**: Los primeros deploys pueden tardar más tiempo. Los siguientes serán más rápidos gracias al caché de Vercel.

