# 📋 Guía Completa: Implementación de Gestión de Contratos

## ✅ Estado de Implementación

### Backend (Completado ✅)
- ✅ Estructura MVC completa
- ✅ Models con Supabase JS
- ✅ Controllers con lógica de negocio
- ✅ Rutas RESTful
- ✅ Middleware de autenticación
- ✅ Manejo de errores consistente
- ✅ Validaciones

### Base de Datos (Completado ✅)
- ✅ SQL completo con todas las tablas
- ✅ Relaciones (FKs)
- ✅ Índices
- ✅ Triggers (validación suma cuotas)
- ✅ RLS policies (multi-tenant)
- ✅ Datos iniciales

### Frontend (En Progreso 🔄)
- ✅ Servicios API (apiClient, contractsService, etc.)
- ⏳ Componentes React (pendiente crear)
- ⏳ Integración en Dashboard

---

## 🚀 Pasos para Implementar

### 1. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env`:
```env
SUPABASE_URL=tu_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SUPABASE_ANON_KEY=tu_anon_key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

Iniciar servidor:
```bash
npm run dev
```

### 2. Ejecutar SQL en Supabase

1. Abre Supabase SQL Editor
2. Copia y pega el contenido de `supabase-contracts-setup.sql`
3. Ejecuta el script completo

### 3. Configurar Frontend

Agregar variable de entorno en `.env`:
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

### 4. Crear Componentes Frontend

Los componentes necesarios son:
- `ContractList.jsx` - Lista con búsqueda y paginación
- `ContractForm.jsx` - Formulario con accordion
- `SearchForm.jsx` - Búsqueda avanzada

**Nota**: Los componentes están diseñados pero necesitan ser creados. Ver estructura en sección siguiente.

---

## 📁 Estructura de Archivos Creados

### Backend
```
backend/
├── app.js                          ✅ Servidor Express
├── package.json                    ✅ Dependencias
├── .env.example                    ✅ Ejemplo de variables
├── middleware/
│   ├── authMiddleware.js          ✅ Autenticación JWT
│   └── errorHandler.js           ✅ Manejo de errores
├── lib/
│   └── supabase.js                ✅ Cliente Supabase
├── models/
│   ├── ContractModel.js           ✅ Model de contratos
│   ├── AttachmentModel.js         ✅ Model de adjuntos
│   ├── InstallmentModel.js        ✅ Model de cuotas
│   ├── ObligationModel.js         ✅ Model de obligaciones
│   ├── ClientModel.js              ✅ Model de clientes
│   └── ConfigModel.js             ✅ Model de configuraciones
├── controllers/
│   ├── contractController.js      ✅ Controller de contratos
│   ├── clientController.js        ✅ Controller de clientes
│   └── configController.js        ✅ Controller de configuraciones
└── routes/
    ├── contractRoutes.js          ✅ Rutas de contratos
    ├── clientRoutes.js           ✅ Rutas de clientes
    └── configRoutes.js           ✅ Rutas de configuraciones
```

### Base de Datos
```
supabase-contracts-setup.sql       ✅ Script SQL completo
```

### Frontend
```
src/
├── lib/
│   └── apiClient.js              ✅ Cliente API
└── services/
    ├── contractsService.js        ✅ Servicio de contratos
    ├── clientsService.js          ✅ Servicio de clientes
    └── configService.js          ✅ Servicio de configuraciones
```

---

## 📝 Endpoints API Disponibles

### Contratos
- `GET /api/contracts` - Listar (con filtros y paginación)
- `GET /api/contracts/:id` - Obtener uno
- `POST /api/contracts` - Crear
- `PUT /api/contracts/:id` - Actualizar
- `DELETE /api/contracts/:id` - Eliminar

### Adjuntos
- `GET /api/contracts/:id/attachments` - Listar
- `POST /api/contracts/:id/attachments` - Crear
- `DELETE /api/contracts/:id/attachments/:attachmentId` - Eliminar

### Cuotas
- `GET /api/contracts/:id/installments` - Listar
- `POST /api/contracts/:id/installments` - Crear
- `DELETE /api/contracts/:id/installments/:installmentId` - Eliminar

### Obligaciones
- `GET /api/contracts/:id/obligations` - Listar
- `POST /api/contracts/:id/obligations` - Crear
- `DELETE /api/contracts/:id/obligations/:obligationId` - Eliminar

### Clientes
- `GET /api/clients` - Listar
- `GET /api/clients/:id` - Obtener uno
- `POST /api/clients` - Crear
- `PUT /api/clients/:id` - Actualizar
- `DELETE /api/clients/:id` - Eliminar

### Configuraciones
- `GET /api/config/all` - Todas las configuraciones
- `GET /api/config/tipos-contratos` - Tipos de contratos
- `GET /api/config/estados-contratos` - Estados de contratos
- `GET /api/config/tipos-documentos` - Tipos de documentos
- `GET /api/config/estados-pagos` - Estados de pagos
- `GET /api/config/tipos-actividades` - Tipos de actividades
- `GET /api/config/productos` - Productos
- `GET /api/config/estados-obligaciones` - Estados de obligaciones
- `GET /api/config/tipos-identificacion` - Tipos de identificación

---

## 🎨 Componentes Frontend a Crear

### 1. ContractList.jsx
- Lista de contratos con tabla
- Paginación (botones prev/next)
- Ordenamiento (click en headers)
- Botones: Crear, Modificar
- Integración con SearchForm

### 2. ContractForm.jsx
- Modal full-screen o página
- Accordion con secciones:
  - Datos básicos
  - Documentos adjuntos
  - Cuotas de pago
  - Obligaciones
- Validaciones
- Manejo de errores con toasts

### 3. SearchForm.jsx
- Input número contrato
- Rango fechas (desde/hasta)
- Select cliente (autocomplete)
- Debounce en búsqueda
- Botón limpiar

### 4. Integración en Dashboard.jsx
- Agregar opción "Gestionar contratos" en sidebar
- Renderizar ContractList cuando se seleccione

---

## 🧪 Tests

Crear archivo `backend/tests/contractController.test.js` con tests básicos usando Jest.

---

## 📦 Dependencias Necesarias

### Backend (ya en package.json)
- express
- @supabase/supabase-js
- cors
- dotenv

### Frontend (agregar si falta)
- react (ya existe)
- react-dom (ya existe)

---

## 🔐 Seguridad

- ✅ Autenticación JWT en todas las rutas
- ✅ RLS en Supabase (multi-tenant)
- ✅ Validaciones en backend
- ✅ Validaciones en frontend
- ✅ Manejo de errores consistente

---

## 📚 Próximos Pasos

1. ✅ Backend completo
2. ✅ SQL completo
3. ✅ Servicios frontend
4. ⏳ Crear componentes React
5. ⏳ Integrar en Dashboard
6. ⏳ Agregar tests
7. ⏳ Documentar uso

---

## 💡 Nota sobre Arquitectura

**Arquitectura MVC implementada**:
- ✅ Separación de responsabilidades
- ✅ Models para acceso a datos
- ✅ Controllers para lógica de negocio
- ✅ Rutas para endpoints
- ✅ Middleware para autenticación y errores

**Ventajas**:
- ✅ Mantenible
- ✅ Escalable
- ✅ Testeable
- ✅ Separación clara de capas

**Alternativa (Supabase BaaS directo)**:
Si prefieres usar Supabase directamente desde el frontend (sin backend Express), es posible pero perderías:
- ❌ Validaciones centralizadas
- ❌ Lógica de negocio en un solo lugar
- ❌ Control sobre operaciones complejas
- ❌ Mejor manejo de errores

La arquitectura MVC es recomendada para sistemas complejos como este.


