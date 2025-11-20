# 📚 Librerías de React Usadas en el Proyecto

## ✅ Librerías Core de React

### 1. **React** (`^18.2.0`)
- **Uso**: Framework base
- **Importado en**: Todos los componentes
- **Hooks nativos usados**:
  - `useState` - Estado local
  - `useEffect` - Efectos secundarios
  - `useMemo` - Memoización (en `Admin.jsx`)
  - `useRef` - Referencias DOM (en `Dashboard.jsx`)
  - `useCallback` - Callbacks memoizados (en `useCalculos.js`)

### 2. **React DOM** (`^18.2.0`)
- **Uso**: Renderizado en el navegador
- **Importado en**: `main.jsx`
- **Método usado**: `ReactDOM.createRoot()`

---

## 📦 Librerías Adicionales (NO son de React)

### 3. **@supabase/supabase-js** (`^2.78.0`)
- **Tipo**: Backend/Database client
- **Uso**: 
  - Autenticación de usuarios
  - Operaciones CRUD en base de datos
  - Real-time subscriptions
- **Importado en**: 
  - `src/lib/supabase.js`
  - Todos los componentes que interactúan con datos
- **Funcionalidades usadas**:
  - `supabase.auth.signInWithPassword()`
  - `supabase.auth.signUp()`
  - `supabase.auth.signOut()`
  - `supabase.auth.getSession()`
  - `supabase.auth.onAuthStateChange()`
  - `supabase.from().select()`
  - `supabase.from().insert()`
  - `supabase.from().update()`
  - `supabase.rpc()`

### 4. **jspdf** (`^3.0.3`)
- **Tipo**: Generación de PDFs
- **Uso**: Exportar operaciones a PDF
- **Importado en**: `src/components/ConsultaOperaciones.jsx`
- **Uso**: `new jsPDF()` para crear documentos PDF

### 5. **jspdf-autotable** (`^5.0.2`)
- **Tipo**: Plugin de jsPDF
- **Uso**: Crear tablas en PDFs
- **Importado en**: `src/components/ConsultaOperaciones.jsx`
- **Uso**: `autoTable(doc, { head, body })` para agregar tablas

### 6. **xlsx** (`^0.18.5`)
- **Tipo**: Manipulación de archivos Excel
- **Uso**: Exportar operaciones a Excel
- **Importado en**: `src/components/ConsultaOperaciones.jsx`
- **Funciones usadas**:
  - `XLSX.utils.json_to_sheet()`
  - `XLSX.utils.book_new()`
  - `XLSX.utils.book_append_sheet()`
  - `XLSX.writeFile()`

---

## 🛠️ Herramientas de Desarrollo

### 7. **Vite** (`^5.0.0`)
- **Tipo**: Build tool / Dev server
- **Uso**: Compilación y servidor de desarrollo
- **Configuración**: `vite.config.js`

### 8. **@vitejs/plugin-react** (`^4.2.1`)
- **Tipo**: Plugin de Vite
- **Uso**: Soporte para React en Vite
- **Configuración**: `vite.config.js`

---

## ❌ Librerías de React que NO estás usando

### Routing
- ❌ **React Router** - No hay routing (SPA de una sola página)
- ❌ **React Location** - No hay routing

### State Management Global
- ❌ **Redux** - No hay state management global
- ❌ **Zustand** - No hay state management global
- ❌ **Jotai** - No hay state management global
- ❌ **Recoil** - No hay state management global

### Data Fetching
- ❌ **React Query (TanStack Query)** - No hay librería de data fetching
- ❌ **SWR** - No hay librería de data fetching
- ❌ **Apollo Client** - No hay GraphQL

### Formularios
- ❌ **React Hook Form** - Formularios nativos
- ❌ **Formik** - Formularios nativos
- ❌ **React Final Form** - Formularios nativos

### UI Libraries
- ❌ **Material-UI (MUI)** - CSS puro
- ❌ **Chakra UI** - CSS puro
- ❌ **Ant Design** - CSS puro
- ❌ **React Bootstrap** - CSS puro
- ❌ **Tailwind CSS** - CSS puro

### Tablas
- ❌ **React Table (TanStack Table)** - Tablas HTML nativas
- ❌ **AG Grid** - Tablas HTML nativas
- ❌ **Material Table** - Tablas HTML nativas

### Iconos
- ❌ **React Icons** - No hay iconos (o emojis en texto)
- ❌ **React Font Awesome** - No hay iconos

### Animaciones
- ❌ **Framer Motion** - CSS animations
- ❌ **React Spring** - CSS animations
- ❌ **React Transition Group** - CSS animations

### Validación
- ❌ **Yup** - Validación manual
- ❌ **Zod** - Validación manual
- ❌ **Joi** - Validación manual

---

## 📊 Resumen

### Librerías Core de React: **2**
1. ✅ `react` - Framework base
2. ✅ `react-dom` - Renderizado

### Librerías Adicionales: **4**
1. ✅ `@supabase/supabase-js` - Backend/Database
2. ✅ `jspdf` - Exportar PDFs
3. ✅ `jspdf-autotable` - Tablas en PDFs
4. ✅ `xlsx` - Exportar Excel

### Herramientas de Build: **2**
1. ✅ `vite` - Build tool
2. ✅ `@vitejs/plugin-react` - Plugin React para Vite

### **Total: 8 dependencias**

---

## 🎯 Conclusión

**Tu proyecto usa React de forma muy "pura"**:
- ✅ Solo hooks nativos de React
- ✅ No hay librerías de UI
- ✅ No hay routing
- ✅ No hay state management global
- ✅ No hay librerías de formularios
- ✅ CSS puro (sin frameworks)

**Ventajas**:
- ✅ Bundle pequeño
- ✅ Sin dependencias innecesarias
- ✅ Control total del código
- ✅ Fácil de mantener

**Desventajas**:
- ⚠️ Más código manual (sin helpers)
- ⚠️ Sin componentes UI pre-construidos
- ⚠️ Sin routing (SPA de una página)

---

## 💡 Recomendaciones (Opcionales)

Si quisieras agregar funcionalidades, podrías considerar:

1. **React Router** - Si necesitas múltiples páginas/rutas
2. **React Hook Form** - Si tienes muchos formularios complejos
3. **React Query** - Si necesitas mejor manejo de data fetching/cache
4. **React Icons** - Si quieres iconos consistentes
5. **Zustand** - Si necesitas state management global (más simple que Redux)

Pero **NO son necesarios** para tu proyecto actual. Tu stack es limpio y funcional. ✅


