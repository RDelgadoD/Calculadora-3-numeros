# 🔑 Guía para Configurar el archivo `.env`

## ✅ Archivo Creado

El archivo `backend/.env` ya fue creado con las variables necesarias. Ahora necesitas reemplazar los valores placeholder con tus credenciales reales de Supabase.

---

## 📋 Contenido Actual del Archivo

Tu archivo `backend/.env` tiene:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
SUPABASE_ANON_KEY=tu_anon_key_aqui
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
OPENAI_API_KEY=sk-tu-api-key-de-openai
```

**Nota sobre OPENAI_API_KEY**: Esta variable es requerida para el chat de consultas. Ver `CONFIGURAR_OPENAI.md` para más detalles.

---

## 🔍 Cómo Obtener las Keys de Supabase

### Paso 1: Ir a tu Proyecto en Supabase

1. Abre tu navegador
2. Ve a [https://supabase.com](https://supabase.com)
3. Inicia sesión
4. Selecciona tu proyecto

### Paso 2: Ir a Settings → API

1. En el menú lateral izquierdo, haz clic en **Settings** (⚙️)
2. Luego haz clic en **API**

### Paso 3: Copiar las Credenciales

Verás una sección que dice **Project API keys**. Ahí encontrarás:

#### 1. **Project URL** (para `SUPABASE_URL`)
   - Copia la URL completa (ejemplo: `https://abcdefghijklmnop.supabase.co`)
   - Reemplaza en `.env`: `SUPABASE_URL=https://tu-url-real.supabase.co`

#### 2. **anon public** key (para `SUPABASE_ANON_KEY`)
   - Es la key que dice "anon" o "public"
   - Copia toda la key (es muy larga)
   - Reemplaza en `.env`: `SUPABASE_ANON_KEY=eyJhbGc...` (tu key completa)

#### 3. **service_role** key (para `SUPABASE_SERVICE_ROLE_KEY`)
   - ⚠️ **IMPORTANTE**: Esta key es SECRETA, no la compartas
   - Haz clic en "Reveal" para verla
   - Copia toda la key
   - Reemplaza en `.env`: `SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...` (tu key completa)

---

## ✏️ Cómo Editar el Archivo `.env`

### Opción 1: Desde VS Code (Recomendado)

1. Abre VS Code
2. Abre la carpeta `backend`
3. Busca el archivo `.env` (puede estar oculto)
4. Si no lo ves, presiona `Ctrl + Shift + P` y busca "Show Hidden Files"
5. Abre el archivo `.env`
6. Reemplaza los valores placeholder con tus keys reales
7. Guarda el archivo (`Ctrl + S`)

### Opción 2: Desde el Explorador de Windows

1. Ve a la carpeta `backend` en el Explorador
2. Si no ves el archivo `.env`, habilita "Mostrar archivos ocultos":
   - Ve a "Vista" → Marca "Elementos ocultos"
3. Haz clic derecho en `.env` → "Abrir con" → "Bloc de notas" o tu editor favorito
4. Edita y guarda

---

## 📝 Ejemplo de Archivo `.env` Completo

Después de reemplazar, tu archivo debería verse así (con tus keys reales):

```env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMn0.abcdefghijklmnopqrstuvwxyz1234567890
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
OPENAI_API_KEY=sk-tu-api-key-de-openai
```

**Nota:** Las keys de ejemplo arriba son ficticias. Usa tus keys reales.

---

## ✅ Verificar que Está Correcto

Después de editar el archivo:

1. **Verifica que no hay espacios extra:**
   - ❌ `SUPABASE_URL = https://...` (incorrecto, hay espacios)
   - ✅ `SUPABASE_URL=https://...` (correcto, sin espacios)

2. **Verifica que las keys están completas:**
   - Las keys de Supabase son muy largas (cientos de caracteres)
   - Asegúrate de copiar toda la key, no solo una parte

3. **Verifica que no hay comillas:**
   - ❌ `SUPABASE_URL="https://..."` (incorrecto, no uses comillas)
   - ✅ `SUPABASE_URL=https://...` (correcto, sin comillas)

---

## 🚀 Después de Configurar

Una vez que hayas reemplazado los valores:

1. **Guarda el archivo** (`Ctrl + S`)
2. **Reinicia el servidor backend:**
   - Detén el servidor (si está corriendo): `Ctrl + C`
   - Inicia de nuevo: `npm run dev`

3. **Verifica que no hay errores:**
   - Deberías ver: `🚀 Servidor backend corriendo en http://localhost:3001`

---

## 🐛 Si Sigue Dando Error

### Error: "SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configurados"

**Posibles causas:**
1. El archivo `.env` no está en la carpeta `backend/`
2. Hay espacios o caracteres extraños en las variables
3. Las keys no están completas
4. El archivo no se guardó correctamente

**Solución:**
1. Verifica que el archivo está en `backend/.env` (no en la raíz)
2. Abre el archivo y verifica que las keys están completas
3. Asegúrate de que no hay espacios alrededor del `=`
4. Guarda el archivo y reinicia el servidor

---

## 📍 Ubicación del Archivo

El archivo debe estar en:
```
MiPrimerProyecto/
└── backend/
    └── .env  ← Aquí
```

**NO** debe estar en:
- ❌ `MiPrimerProyecto/.env` (raíz del proyecto)
- ❌ `MiPrimerProyecto/backend/backend/.env` (carpeta incorrecta)

---

## 🔒 Seguridad

⚠️ **IMPORTANTE:**
- **NUNCA** subas el archivo `.env` a GitHub
- El archivo `.env` ya está en `.gitignore` (no se subirá)
- **NO** compartas tus keys con nadie
- Si alguien tiene tu `service_role` key, puede acceder a toda tu base de datos

---

¡Listo! Una vez que reemplaces los valores, el servidor debería iniciar correctamente. 🎉

