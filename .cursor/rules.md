# Reglas de Arquitectura y Código - Proyecto Multi-Tenant SaaS

## ARQUITECTURA GENERAL

### Stack Tecnológico
- **Frontend**: React 18 + Vite, componentes funcionales con hooks
- **Backend**: Node.js + Express.js con arquitectura MVC
- **Base de datos**: Supabase (PostgreSQL) con Row Level Security (RLS)
- **Autenticación**: Supabase Auth con JWT tokens
- **Storage**: Supabase Storage para archivos

### Estructura de Carpetas
```
/
├── src/                    # Frontend React
│   ├── components/         # Componentes React (un archivo .jsx y .css por componente)
│   ├── services/          # Servicios para consumir API del backend
│   ├── lib/               # Utilidades (apiClient, supabase, hooks)
│   └── hooks/             # Custom hooks de React
├── backend/               # Backend Express.js
│   ├── controllers/       # Lógica de negocio y validaciones
│   ├── models/            # Acceso a datos (Supabase SDK)
│   ├── routes/            # Definición de rutas API
│   ├── middleware/        # Middleware (auth, error handling)
│   └── lib/               # Utilidades (supabase clients)
└── api/                   # Serverless functions (Vercel) si aplica
```

## PATRONES DE CÓDIGO - FRONTEND

### Componentes React
- **Siempre usar componentes funcionales** con hooks (no clases)
- **Un componente = un archivo .jsx + un archivo .css** (mismo nombre)
- **Usar hooks**: `useState`, `useEffect`, `useCallback`, `useMemo` según necesidad
- **Props**: Usar destructuring, validar con PropTypes si es necesario
- **Estado local**: `useState` para estado del componente
- **Estado global**: No usar Redux, usar props drilling o context solo si es necesario

### Servicios (src/services/)
- **Patrón**: Cada entidad tiene su servicio (ej: `contractsService.js`)
- **Importar**: `api` desde `../lib/apiClient` (NO usar fetch directamente)
- **Estructura**:
```javascript
import api from '../lib/apiClient'

export const contractsService = {
  list: async (params = {}) => {
    return api.get('/contracts', params)
  },
  getById: async (id) => {
    return api.get(`/contracts/${id}`)
  },
  create: async (contractData) => {
    return api.post('/contracts', contractData)
  },
  update: async (id, contractData) => {
    return api.put(`/contracts/${id}`, contractData)
  },
  delete: async (id) => {
    return api.delete(`/contracts/${id}`)
  }
}
```

### Manejo de Errores Frontend
- **Try-catch** en funciones async
- **Mostrar errores** al usuario con mensajes claros en español
- **No mostrar errores técnicos** directamente, traducir a mensajes amigables
- **Loading states**: Siempre mostrar estados de carga (`loading`, `uploading`, etc.)

### Eventos y Formularios
- **Prevenir propagación**: Usar `e.stopPropagation()` en eventos anidados
- **Prevenir default**: Usar `e.preventDefault()` en formularios
- **Validación**: Validar en frontend Y backend
- **Campos opcionales**: Convertir cadenas vacías a `null` antes de enviar

## PATRONES DE CÓDIGO - BACKEND

### Arquitectura MVC
- **Models** (`backend/models/`): Solo acceso a datos usando Supabase SDK
- **Controllers** (`backend/controllers/`): Lógica de negocio, validaciones, respuestas HTTP
- **Routes** (`backend/routes/`): Solo definición de rutas, delegar a controllers
- **Middleware**: Autenticación, manejo de errores, CORS

### Models (backend/models/)
- **Usar `supabaseAdmin`** (service_role) para bypass RLS cuando sea necesario
- **Estructura**:
```javascript
import { supabaseAdmin } from '../lib/supabase.js'

export class ContractModel {
  static async findAll({ clienteId, filters, page, limit }) {
    let query = supabaseAdmin
      .from('contracts')
      .select('*, clients(...)', { count: 'exact' })
      .eq('cliente_id', clienteId)
    // ... filtros
    const { data, error, count } = await query
    if (error) throw error
    return { data, total: count, page, limit }
  }
  
  static async create(contractData) {
    const { data, error } = await supabaseAdmin
      .from('contracts')
      .insert([contractData])
      .select()
      .single()
    if (error) throw error
    return data
  }
}
```

### Controllers (backend/controllers/)
- **Validaciones**: Validar datos de entrada antes de llamar al Model
- **Respuestas consistentes**:
```javascript
// Éxito
res.json({
  success: true,
  data: result,
  message: 'Operación exitosa'
})

// Error
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Mensaje de error en español'
  }
})
```
- **Multi-tenancy**: Siempre usar `req.user.clienteId` del middleware
- **Campos opcionales**: Convertir cadenas vacías a `null` antes de guardar

### Middleware de Autenticación
- **Verificar JWT** con Supabase Auth
- **Extraer usuario** de la tabla `usuarios` usando `supabaseAdmin` (bypass RLS)
- **Agregar a req.user**: `{ id, email, clienteId, rol }`
- **Manejar errores** de autenticación con respuestas consistentes

### Rutas (backend/routes/)
- **Estructura simple**: Solo definir rutas y delegar a controllers
```javascript
import express from 'express'
import { ContractController } from '../controllers/contractController.js'

const router = express.Router()

router.get('/', ContractController.list)
router.get('/:id', ContractController.getById)
router.post('/', ContractController.create)
router.put('/:id', ContractController.update)
router.delete('/:id', ContractController.delete)

export default router
```

## MULTI-TENANCY

### Principios
- **Cada tabla** debe tener `cliente_id UUID REFERENCES clientes(id)`
- **RLS habilitado** en todas las tablas con datos sensibles
- **Políticas RLS**: Usar funciones `fn_get_user_cliente_id(auth.uid())` y `fn_user_is_admin(auth.uid())`
- **Backend**: Siempre filtrar por `cliente_id` del usuario autenticado
- **Frontend**: No filtrar por cliente, el backend lo hace automáticamente

### Funciones SQL Helper
- `fn_get_user_cliente_id(user_uuid)`: Obtiene cliente_id del usuario
- `fn_user_is_admin(user_uuid)`: Verifica si usuario es admin
- Ambas deben ser `SECURITY DEFINER` para bypass RLS

## AUTENTICACIÓN

### Frontend
- **Cliente Supabase**: `src/lib/supabase.js` con `anon key`
- **Obtener token**: `supabase.auth.getSession()` para obtener JWT
- **Enviar token**: Header `Authorization: Bearer [token]` en todas las requests al backend

### Backend
- **Cliente Supabase**: `backend/lib/supabase.js`
  - `supabaseAdmin`: service_role key (bypass RLS)
  - `supabaseClient`: anon key (respeta RLS)
- **Verificar token**: Usar `supabase.auth.getUser(token)`
- **Extraer usuario**: Consultar tabla `usuarios` con `supabaseAdmin`

## MANEJO DE DATOS

### Supabase SDK (NO REST API directa)
- **SIEMPRE usar SDK** `@supabase/supabase-js`, NO hacer fetch a REST API
- **Backend**: Usar `supabaseAdmin` para operaciones privilegiadas
- **Frontend**: Usar `supabase` (anon key) para auth y storage

### Storage (Archivos)
- **Bucket**: Crear buckets en Supabase Dashboard
- **Path**: NO incluir nombre del bucket en el path (ej: `contracts/archivo.pdf` → path: `archivo.pdf`)
- **RLS**: Configurar políticas RLS para el bucket

### Campos Opcionales (Fechas, etc.)
- **Frontend**: Convertir cadenas vacías a `null` antes de enviar
- **Backend**: Validar y convertir cadenas vacías a `null` antes de guardar
- **Ejemplo**:
```javascript
fecha_terminacion: formData.fecha_terminacion?.trim() || null
```

## ESTILOS Y UI

### CSS
- **Un archivo CSS por componente** (mismo nombre)
- **Clases descriptivas**: Usar nombres claros (ej: `.btn-create`, `.contract-form-modal`)
- **Responsive**: Usar media queries para móviles
- **Colores**: Verde claro (#27ae60) como color principal
- **Botones**: Tamaños proporcionados, padding adecuado (ej: `0.4rem 1rem`)

### Formularios - Reglas Obligatorias
**TODOS los formularios (existentes y futuros) DEBEN cumplir con los siguientes requisitos:**

#### Mobile First
- **Diseño responsive**: Usar Tailwind CSS con prefijos responsive (`sm:`, `md:`, `lg:`) o media queries
- **Campos apilados en móvil**: En pantallas pequeñas, los campos deben apilarse verticalmente
- **Botones full-width en móvil**: Los botones de acción deben ocupar el ancho completo en móviles
- **Inputs adaptativos**: Los campos de entrada deben ajustarse al tamaño de pantalla
- **Tablas responsive**: En móvil, convertir tablas a vistas de tarjetas o scroll horizontal

#### Modo Oscuro y Claro
- **Soporte dual obligatorio**: TODOS los formularios deben funcionar correctamente en modo claro y oscuro
- **Clases dark mode**: Usar el prefijo `.dark` de Tailwind o clases CSS con selector `.dark`
- **Elementos que DEBEN tener modo oscuro**:
  - Contenedores de formularios (fondos: `#1f2937` en oscuro, `white` en claro)
  - Campos de entrada (`input`, `select`, `textarea`): fondo `#374151` o `#4b5563` en oscuro
  - Labels: color `#e5e7eb` en oscuro, `#2c3e50` en claro
  - Bordes: `#4b5563` o `#6b7280` en oscuro, `#ced4da` en claro
  - Botones: ajustar colores de fondo y texto para ambos modos
  - Tablas: filas con fondo `#1f2937` en oscuro, texto `#e5e7eb`
  - Modales: fondo `#1f2937` en oscuro
  - Mensajes de error/éxito: colores adaptados para ambos modos
  - Badges y etiquetas: colores contrastantes en ambos modos

#### Estilos Consistentes
- **Esquema de colores**:
  - Primario: Teal profundo `#0D9488` (encabezados y acentos)
  - Secundario: Gris suave `#6B7280` (texto y bordes)
  - Fondo claro: `#F9FAFB`
  - Fondo oscuro: `#1f2937` (contenedores), `#374151` (inputs)
  - Éxito: Verde `#22C55E`
  - Error: Rojo `#EF4444`
- **Bordes redondeados**: Usar `border-radius` consistente (8px-12px para contenedores, 6px para inputs)
- **Sombras sutiles**: Box-shadow suave para profundidad
- **Transiciones**: Transiciones suaves (0.2s-0.3s) en hover y focus
- **Espaciado**: Padding y margin consistentes (usar sistema de espaciado de Tailwind o valores fijos)

#### Estructura de Formularios
- **Grid responsive**: Usar CSS Grid con `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))` o Tailwind `grid-cols-1 md:grid-cols-2`
- **Campos full-width**: Campos de texto largo deben usar `grid-column: 1 / -1` o `col-span-full`
- **Agrupación visual**: Agrupar campos relacionados con contenedores o secciones
- **Labels claros**: Labels descriptivos con asterisco (*) para campos requeridos
- **Placeholders útiles**: Placeholders que guíen al usuario

#### Validación Visual
- **Estados de error**: Bordes rojos y mensajes de error claros
- **Estados de éxito**: Feedback visual positivo cuando corresponda
- **Estados disabled**: Opacidad reducida y cursor not-allowed
- **Estados focus**: Bordes destacados con color primario y sombra sutil

#### Ejemplo de Estructura CSS para Formularios
```css
/* Modo claro (default) */
.form-container {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.form-group input {
  background: white;
  border: 1px solid #ced4da;
  color: #2c3e50;
}

/* Modo oscuro */
.dark .form-container {
  background: #1f2937;
  border-color: #4b5563;
}

.dark .form-group input {
  background: #374151;
  border-color: #6b7280;
  color: #e5e7eb;
}

/* Responsive */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .btn-submit {
    width: 100%;
  }
}
```

### Componentes Modales
- **Overlay**: Prevenir cierre accidental con `onClick` y `onMouseDown`
- **Stop propagation**: Usar `e.stopPropagation()` en formularios anidados
- **Eventos**: Manejar `onClick`, `onMouseDown`, `onKeyDown` según necesidad
- **Modo oscuro**: Aplicar estilos de modo oscuro a overlays y modales

## IDIOMA Y MENSAJES

### Reglas de Idioma
- **Labels y mensajes**: SIEMPRE en español
- **Nombres de archivos**: En inglés (camelCase o kebab-case)
- **Variables y funciones**: En inglés
- **Comentarios en código**: En español
- **Mensajes de error**: En español, claros y amigables

### Ejemplos
```javascript
// ✅ CORRECTO
const error = 'Error al guardar el contrato'
const label = 'Número de Contrato *'

// ❌ INCORRECTO
const error = 'Error saving contract'
const label = 'Contract Number *'
```

## CONVENCIONES DE NOMBRES

### Archivos
- **Componentes**: PascalCase (ej: `ContractForm.jsx`)
- **Servicios**: camelCase (ej: `contractsService.js`)
- **Models/Controllers**: PascalCase (ej: `ContractModel.js`)
- **CSS**: Mismo nombre que el componente (ej: `ContractForm.css`)

### Variables y Funciones
- **camelCase** para variables y funciones
- **PascalCase** para componentes y clases
- **UPPER_SNAKE_CASE** para constantes
- **Descriptivos**: Nombres que expliquen su propósito

## MANEJO DE ESTADO

### React Hooks
- **useState**: Para estado local del componente
- **useEffect**: Para efectos secundarios (cargar datos, suscripciones)
- **useCallback**: Para funciones que se pasan como props o dependencias
- **useMemo**: Para valores calculados costosos
- **Dependencias**: Siempre incluir todas las dependencias en arrays de dependencias

### Patrón de Carga de Datos
```javascript
const [data, setData] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true)
      const result = await service.list()
      setData(result.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  loadData()
}, [dependencies])
```

## VALIDACIONES

### Frontend
- **Validación básica**: HTML5 `required`, `type`, `min`, `max`
- **Validación avanzada**: JavaScript antes de enviar
- **Feedback visual**: Mostrar errores debajo de campos

### Backend
- **Validar TODO**: Nunca confiar solo en validación frontend
- **Mensajes claros**: Errores en español, descriptivos
- **Códigos de error**: Usar códigos consistentes (`VALIDATION_ERROR`, `NOT_FOUND`, etc.)

## ERROR HANDLING

### Frontend
- **Try-catch** en todas las funciones async
- **Mostrar mensajes** al usuario (no logs técnicos)
- **Estados de error**: Usar `useState` para manejar errores
- **Boundaries**: Usar ErrorBoundary para errores de renderizado

### Backend
- **Middleware de errores**: Centralizar manejo de errores
- **Códigos HTTP**: Usar códigos apropiados (400, 401, 404, 500)
- **Respuestas consistentes**: Mismo formato para todos los errores

## TESTING

### Backend
- **Jest** para tests unitarios
- **Tests en**: `backend/tests/`
- **Estructura**: Un archivo de test por controller

## VARIABLES DE ENTORNO

### Frontend (.env)
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=http://localhost:3001/api
```

### Backend (backend/.env)
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

## REGLAS ESPECÍFICAS

### Eventos en Formularios Anidados
- **SIEMPRE** usar `e.stopPropagation()` en handlers de formularios anidados
- **SIEMPRE** usar `onMouseDown` con `stopPropagation` para prevenir cierres accidentales
- **Botones**: Usar `type="button"` para botones que no son submit

### Paginación
- **Backend**: Retornar `{ data, meta: { total, page, limit, totalPages } }`
- **Frontend**: Mostrar información de paginación y botones prev/next

### Búsqueda y Filtros
- **Debounce**: Usar debounce en búsquedas de texto (ej: 300ms)
- **Filtros**: Enviar como query params al backend
- **Reset**: Permitir limpiar filtros fácilmente

### Archivos y Storage
- **Upload**: Subir a Supabase Storage usando SDK
- **Path**: NO incluir nombre del bucket en el path
- **URLs**: Obtener URL pública con `getPublicUrl()`

## IMPORTANTE

- **NUNCA** usar REST API directa de Supabase, SIEMPRE usar SDK
- **SIEMPRE** validar en frontend Y backend
- **SIEMPRE** filtrar por `cliente_id` en backend (multi-tenancy)
- **SIEMPRE** convertir campos opcionales vacíos a `null`
- **SIEMPRE** usar español para mensajes y labels
- **SIEMPRE** prevenir propagación de eventos en formularios anidados
- **SIEMPRE** usar `supabaseAdmin` en backend para bypass RLS cuando sea necesario
- **SIEMPRE** aplicar diseño mobile-first y soporte de modo oscuro/claro a TODOS los formularios

