# 🚀 Deploy en Vercel - Guía Paso a Paso

## ✅ Ya Completado:
- ✓ Código subido a GitHub
- ✓ Repositorio: https://github.com/RDelgadoD/Calculadora-3-numeros

## 📋 Siguiente Paso: Deploy en Vercel

### Paso 1: Crear Cuenta / Iniciar Sesión en Vercel

1. Ve a: **https://vercel.com**
2. Haz clic en **"Sign Up"** o **"Log In"**
3. **Selecciona "Continue with GitHub"**
4. Autoriza a Vercel para acceder a tus repositorios de GitHub

### Paso 2: Importar el Proyecto

1. En el dashboard de Vercel, haz clic en **"Add New..."** o **"Import Project"**
2. Busca y selecciona: **"Calculadora-3-numeros"** (o el nombre que tenga en GitHub)
3. Haz clic en **"Import"**

### Paso 3: Configurar el Proyecto

Vercel debería detectar automáticamente:
- ✅ Framework: **Vite**
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`

**NO cambies nada de esto, está correcto.**

### Paso 4: ⚠️ IMPORTANTE - Variables de Entorno

1. Antes de hacer clic en "Deploy", haz clic en **"Environment Variables"**
2. Agrega estas dos variables:

   **Variable 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: (Pega aquí tu URL de Supabase - la que tienes en tu archivo .env)
   - Environments: Selecciona las 3 opciones (Production, Preview, Development)

   **Variable 2:**
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: (Pega aquí tu clave anon de Supabase - la que tienes en tu archivo .env)
   - Environments: Selecciona las 3 opciones (Production, Preview, Development)

3. Haz clic en **"Save"** para cada variable

### Paso 5: Hacer el Deploy

1. Después de agregar las variables de entorno, haz clic en **"Deploy"**
2. Vercel comenzará a construir y desplegar tu aplicación
3. Esto tomará aproximadamente 2-3 minutos

### Paso 6: ¡Listo! 🎉

Después del deploy, Vercel te dará:
- **Production URL**: `https://calculadora-3-numeros.vercel.app` (o similar)
- Tu aplicación estará en línea y funcionando

### Paso 7: Verificar que Funciona

1. Abre la URL que te dio Vercel
2. Prueba iniciar sesión
3. Verifica que la calculadora funcione
4. Prueba la consulta de operaciones

## 🔄 Actualizaciones Automáticas

Cada vez que hagas `git push` a GitHub, Vercel automáticamente:
- Detectará los cambios
- Construirá la nueva versión
- Desplegará automáticamente
- Te enviará un email de notificación

## 📝 Notas Importantes

- **Variables de entorno**: Debes agregarlas en Vercel, no funcionarán si solo están en tu `.env` local
- **Archivo `.env`**: NO debe estar en GitHub (ya está en `.gitignore`)
- **SSL/HTTPS**: Vercel lo proporciona automáticamente, gratis

---

**Avísame cuando hayas completado el paso 4 (agregar variables de entorno) y te ayudo con cualquier problema que surja.**

