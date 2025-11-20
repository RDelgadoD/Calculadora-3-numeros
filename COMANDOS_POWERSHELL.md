# 🔧 Comandos para PowerShell (Windows)

## ⚠️ Importante: PowerShell NO usa `&&`

En PowerShell, el operador `&&` no funciona. Usa `;` en su lugar.

---

## 🚀 Iniciar Servidores

### Opción 1: Comandos Separados (Recomendado)

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

### Opción 2: Usar `;` en PowerShell

```powershell
cd backend; npm run dev
```

---

## 📝 Comandos Útiles

### Verificar que el backend está corriendo:
```powershell
netstat -ano | findstr :3001
```

### Detener un proceso en el puerto 3001:
```powershell
# Primero encontrar el PID
netstat -ano | findstr :3001

# Luego matar el proceso (reemplaza PID con el número)
taskkill /PID <PID> /F
```

### Ver logs del backend:
```powershell
cd backend
npm run dev
```

---

## 🔍 Verificar Instalación

### Backend:
```powershell
cd backend
npm install
npm run dev
```

### Frontend:
```powershell
npm install
npm run dev
```

---

## ⚡ Atajos Rápidos

### Abrir dos terminales en VS Code:
1. `Ctrl + Shift + `` (backtick) - Abre nueva terminal
2. `Ctrl + Shift + `` - Abre otra terminal
3. En una: `cd backend; npm run dev`
4. En otra: `npm run dev`

---

## 🐛 Solución de Problemas

### Error: "Puerto 3001 ya en uso"
```powershell
# Encontrar proceso
netstat -ano | findstr :3001

# Matar proceso (reemplaza PID)
taskkill /PID <PID> /F
```

### Error: "No se encuentra el módulo"
```powershell
# Reinstalar dependencias
cd backend
rm -r node_modules
npm install
```

---

## ✅ Checklist

- [ ] Backend corriendo en puerto 3001
- [ ] Frontend corriendo en puerto 5173
- [ ] Sin errores en consola
- [ ] Variables de entorno configuradas

