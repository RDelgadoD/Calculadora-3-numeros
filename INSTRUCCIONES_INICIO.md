# 🚀 Instrucciones para Iniciar el Sistema

## ⚠️ IMPORTANTE: PowerShell NO usa `&&`

En PowerShell, usa `;` o ejecuta comandos separados.

---

## 📋 Paso a Paso

### 1️⃣ Configurar Backend

**Crear archivo `.env` en la carpeta `backend/`:**

1. Abre el archivo `backend/.env.example` como referencia
2. Crea un nuevo archivo llamado `.env` en `backend/`
3. Agrega el siguiente contenido (reemplaza con tus valores de Supabase):

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
SUPABASE_ANON_KEY=tu_anon_key_aqui
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**¿Dónde obtener las keys?**
1. Ve a tu proyecto en Supabase
2. Settings → API
3. Copia:
   - `URL` → `SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
   - `anon` key → `SUPABASE_ANON_KEY`

---

### 2️⃣ Iniciar Backend

**Abre una terminal (Terminal 1) y ejecuta:**

```powershell
cd backend
npm run dev
```

**Deberías ver:**
```
🚀 Servidor backend corriendo en http://localhost:3001
📝 Entorno: development
```

**Si ves errores:**
- Verifica que el archivo `.env` existe y tiene las variables correctas
- Verifica que las keys de Supabase son correctas

---

### 3️⃣ Configurar Frontend

**Crear/actualizar archivo `.env` en la raíz del proyecto:**

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

---

### 4️⃣ Iniciar Frontend

**Abre OTRA terminal (Terminal 2) y ejecuta:**

```powershell
npm run dev
```

**Deberías ver:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## ✅ Verificar que Todo Funciona

1. **Backend corriendo:**
   - Abre: http://localhost:3001/api/health
   - Deberías ver: `{"status":"ok",...}`

2. **Frontend corriendo:**
   - Abre: http://localhost:5173
   - Deberías ver la aplicación

3. **Probar la API:**
   - Abre: http://localhost:3001/api/health
   - Debería responder con JSON

---

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```powershell
cd backend
npm install
```

### Error: "Puerto 3001 ya en uso"
```powershell
# Encontrar proceso
netstat -ano | findstr :3001

# Matar proceso (reemplaza <PID> con el número que aparece)
taskkill /PID <PID> /F
```

### Error: "SUPABASE_URL must be configured"
- Verifica que el archivo `.env` existe en `backend/`
- Verifica que tiene todas las variables
- Reinicia el servidor backend

### Error: "CORS"
- Verifica que `CORS_ORIGIN` en backend `.env` es `http://localhost:5173`
- Verifica que el frontend está en el puerto 5173

---

## 📝 Comandos PowerShell Correctos

### ❌ INCORRECTO:
```powershell
cd backend && npm run dev
```

### ✅ CORRECTO:
```powershell
cd backend
npm run dev
```

O:
```powershell
cd backend; npm run dev
```

---

## 🎯 Resumen Rápido

**Terminal 1:**
```powershell
cd backend
npm run dev
```

**Terminal 2:**
```powershell
npm run dev
```

**Abrir navegador:**
- Frontend: http://localhost:5173
- Backend Health: http://localhost:3001/api/health

---

## 📚 Archivos de Referencia

- `COMANDOS_POWERSHELL.md` - Comandos útiles para PowerShell
- `README_CONTRATOS.md` - Documentación completa
- `GUIA_CONTRATOS_IMPLEMENTACION.md` - Guía técnica

---

¡Listo! Si tienes problemas, revisa los errores en la consola y verifica las variables de entorno.

