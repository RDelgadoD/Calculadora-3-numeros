# 🔧 Solución: Error "EADDRINUSE" (Puerto Ocupado)

## ❌ Error Común

```
Error: listen EADDRINUSE: address already in use :::3001
```

Este error significa que **el puerto 3001 ya está siendo usado** por otro proceso.

---

## ✅ Solución Rápida

### Opción 1: Detener el Proceso (Recomendado)

**En PowerShell:**
```powershell
# 1. Encontrar el proceso que usa el puerto 3001
netstat -ano | findstr :3001

# 2. Verás algo como:
# TCP    0.0.0.0:3001    LISTENING       46672
# El número al final (46672) es el PID

# 3. Detener el proceso (reemplaza 46672 con tu PID)
taskkill /PID 46672 /F
```

### Opción 2: Cambiar el Puerto

Si prefieres usar otro puerto, edita `backend/.env`:

```env
PORT=3002
```

Y también actualiza `CORS_ORIGIN` si es necesario.

---

## 🔍 Verificar que el Puerto Está Libre

```powershell
netstat -ano | findstr :3001
```

Si no muestra nada (o solo conexiones en estado SYN_SENT), el puerto está libre.

---

## 🚀 Reiniciar el Servidor

Después de liberar el puerto:

```powershell
cd backend
npm run dev
```

---

## 💡 Prevención

**Para evitar este problema:**

1. **Siempre detén el servidor correctamente:**
   - Presiona `Ctrl + C` en la terminal donde está corriendo
   - Espera a que se detenga completamente

2. **Verifica procesos antes de iniciar:**
   ```powershell
   netstat -ano | findstr :3001
   ```

3. **Si usas VS Code:**
   - Cierra todas las terminales que tengan `npm run dev` corriendo
   - Usa solo una terminal para el backend

---

## 🐛 Si el Problema Persiste

1. **Cierra VS Code completamente**
2. **Abre el Administrador de Tareas** (Ctrl + Shift + Esc)
3. **Busca procesos "node" o "node.exe"**
4. **Termina los procesos relacionados con tu proyecto**
5. **Vuelve a abrir VS Code y reinicia**

---

## 📝 Nota

El proceso ya fue detenido. Ahora puedes reiniciar el servidor sin problemas.

