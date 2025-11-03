# Guía de Deploy en Netlify

## Ventajas de Netlify
- ✅ Completamente gratuito para proyectos personales
- ✅ Deploy automático desde GitHub
- ✅ SSL/HTTPS incluido
- ✅ Dominio personalizado gratuito
- ✅ Fácil configuración
- ✅ Formularios y funciones serverless gratuitas

## Pasos para el Deploy

### Paso 1: Preparar el Repositorio Git
(Mismo proceso que para Vercel)

### Paso 2: Desplegar en Netlify

1. Ve a [https://www.netlify.com](https://www.netlify.com)
2. Haz clic en **"Sign up"** o **"Log in"**
3. Inicia sesión con tu cuenta de GitHub
4. Haz clic en **"Add new site" > "Import an existing project"**
5. Selecciona tu repositorio de GitHub
6. Configura el build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. Click en **"Advanced"** para agregar variables de entorno:
   - `VITE_SUPABASE_URL` = Tu URL de Supabase
   - `VITE_SUPABASE_ANON_KEY` = Tu clave anon de Supabase
8. Haz clic en **"Deploy site"**
9. ¡Listo! Tu aplicación estará en línea

### Paso 3: Acceder a tu Aplicación

Netlify te dará una URL como:
- `https://tu-proyecto.netlify.app`

## Actualizaciones Automáticas

Funciona igual que Vercel: cada push a `main` genera un nuevo deploy automático.

## Comparación con Vercel

- Netlify: Más funciones adicionales (formularios, funciones serverless)
- Vercel: Ligeramente más rápido, mejor para proyectos Next.js
- Ambos son excelentes para React + Vite
