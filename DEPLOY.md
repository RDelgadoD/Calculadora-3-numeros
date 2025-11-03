# 🚀 Opciones de Deploy Gratuito

## Comparación de Plataformas

| Plataforma | Facilidad | Velocidad | Gratis | Recomendado Para |
|------------|-----------|-----------|--------|------------------|
| **Vercel** ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Sí | React/Vite (MEJOR OPCIÓN) |
| **Netlify** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Sí | React/Vite |
| **Cloudflare Pages** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ Sí | React/Vite |
| **GitHub Pages** | ⭐⭐⭐ | ⭐⭐⭐ | ✅ Sí | Proyectos simples |
| **Render** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Sí (con límites) | Backend + Frontend |
| **Railway** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Sí (con límites) | Full-stack apps |

## 🎯 Recomendación: **Vercel**

### ¿Por qué Vercel?
- ✅ Configuración automática para Vite
- ✅ Deploy en ~2 minutos
- ✅ SSL/HTTPS gratuito automático
- ✅ Dominio personalizado gratis
- ✅ Deploy automático desde GitHub
- ✅ Preview deployments en PRs
- ✅ Variables de entorno seguras
- ✅ 100GB de ancho de banda/mes gratis

## 📋 Pre-requisitos

1. Cuenta de GitHub (gratuita)
2. Repositorio en GitHub con tu código
3. Variables de entorno de Supabase listas

## 🛠️ Proceso de Deploy

### Opción 1: Vercel (Recomendado) - 5 minutos

Ver archivo: `DEPLOY_VERCEL.md`

### Opción 2: Netlify - 5 minutos

Ver archivo: `DEPLOY_NETLIFY.md`

### Opción 3: Cloudflare Pages

1. Ve a [Cloudflare Pages](https://pages.cloudflare.com)
2. Conecta tu repositorio GitHub
3. Configura:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Agrega variables de entorno
5. Deploy

## 🔐 Variables de Entorno Necesarias

En todas las plataformas, necesitas agregar:

```
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anon
```

## ✅ Checklist Pre-Deploy

- [ ] Código subido a GitHub
- [ ] `npm run build` funciona localmente
- [ ] Variables de entorno de Supabase listas
- [ ] `.env` está en `.gitignore` (no debe subirse)
- [ ] No hay errores en la consola

## 🆘 ¿Necesitas Ayuda?

Puedo ayudarte a:
1. Preparar el repositorio Git
2. Configurar el deploy en Vercel paso a paso
3. Configurar variables de entorno
4. Solucionar problemas de build

Solo necesitas decirme: **"Ayúdame a hacer deploy en Vercel"** y te guío paso a paso.
