# Guía de Deploy en Vercel

## Ventajas de Vercel
- ✅ Completamente gratuito para proyectos personales
- ✅ Deploy automático desde GitHub
- ✅ SSL/HTTPS incluido
- ✅ Dominio personalizado gratuito
- ✅ Configuración mínima
- ✅ Perfecto para React + Vite
- ✅ Variables de entorno seguras
- ✅ Preview deployments para cada PR

## Pasos para el Deploy

### Paso 1: Preparar el Repositorio Git

1. Si aún no tienes Git inicializado, ejecuta:
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Crea un repositorio en GitHub:
   - Ve a https://github.com/new
   - Crea un repositorio nuevo (público o privado)
   - NO inicialices con README, .gitignore o licencia

3. Conecta tu repositorio local:
```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

### Paso 2: Desplegar en Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Haz clic en **"Sign Up"** o **"Login"**
3. Inicia sesión con tu cuenta de GitHub
4. Haz clic en **"Add New Project"** o **"Import Project"**
5. Selecciona tu repositorio de GitHub
6. Vercel detectará automáticamente que es un proyecto Vite
7. **IMPORTANTE**: Configura las variables de entorno:
   - Click en **"Environment Variables"**
   - Agrega:
     - `VITE_SUPABASE_URL` = Tu URL de Supabase
     - `VITE_SUPABASE_ANON_KEY` = Tu clave anon de Supabase
8. Haz clic en **"Deploy"**
9. ¡Listo! Tu aplicación estará en línea en ~2 minutos

### Paso 3: Acceder a tu Aplicación

Después del deploy, Vercel te dará una URL como:
- `https://tu-proyecto.vercel.app`

### Paso 4: Dominio Personalizado (Opcional)

1. En el dashboard de Vercel, ve a **Settings > Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar DNS

## Actualizaciones Automáticas

Cada vez que hagas `git push` a la rama `main`, Vercel:
- Detectará los cambios automáticamente
- Construirá la aplicación
- Desplegará la nueva versión
- Te notificará por email

## Preview Deployments

Vercel crea automáticamente previews de tus Pull Requests en GitHub, permitiéndote probar cambios antes de mergear.

## Solución de Problemas

### Build falla
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en el dashboard de Vercel
- Asegúrate de que `npm run build` funcione localmente

### Variables de entorno no funcionan
- Recuerda que en Vite, las variables deben empezar con `VITE_`
- Reinicia el deploy después de agregar nuevas variables

## Costos

**Plan Hobby (Gratuito)** incluye:
- Deployments ilimitados
- 100GB de ancho de banda por mes
- SSL automático
- Dominio personalizado
- Perfecto para proyectos personales y pequeños
