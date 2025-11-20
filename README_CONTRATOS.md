# 📄 Sistema de Gestión de Contratos - Documentación Completa

## 🎯 Resumen

Sistema completo de gestión de contratos implementado con arquitectura **MVC en Node.js/Express** para el backend y **React** para el frontend. Incluye:

- ✅ CRUD completo de contratos
- ✅ Gestión de clientes (contratantes)
- ✅ Documentos adjuntos
- ✅ Cuotas de pago
- ✅ Obligaciones
- ✅ Multi-tenancy con RLS
- ✅ Búsqueda avanzada con paginación
- ✅ Validaciones en backend y frontend

---

## 📋 Tabla de Contenidos

1. [Instalación y Configuración](#instalación-y-configuración)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Base de Datos](#base-de-datos)
4. [Backend API](#backend-api)
5. [Frontend](#frontend)
6. [Despliegue](#despliegue)
7. [Testing](#testing)

---

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js v20+
- Cuenta de Supabase
- Git

### Paso 1: Clonar y Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env`:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
SUPABASE_ANON_KEY=tu_anon_key
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Obtener las keys de Supabase:**
1. Ve a tu proyecto en Supabase
2. Settings → API
3. Copia `URL` y `service_role` key (y `anon` key)

### Paso 2: Configurar Base de Datos

1. Abre Supabase SQL Editor
2. Copia el contenido de `supabase-contracts-setup.sql`
3. Ejecuta el script completo
4. Verifica que todas las tablas se crearon correctamente

### Paso 3: Configurar Frontend

En el archivo `.env` del frontend (raíz del proyecto):

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### Paso 4: Iniciar Servidores

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## 📁 Estructura del Proyecto

```
MiPrimerProyecto/
├── backend/                    # Backend Express.js
│   ├── app.js                  # Servidor principal
│   ├── package.json
│   ├── .env                    # Variables de entorno
│   ├── middleware/
│   │   ├── authMiddleware.js   # Autenticación JWT
│   │   └── errorHandler.js     # Manejo de errores
│   ├── lib/
│   │   └── supabase.js         # Cliente Supabase
│   ├── models/                 # Capa de datos
│   │   ├── ContractModel.js
│   │   ├── ClientModel.js
│   │   ├── AttachmentModel.js
│   │   ├── InstallmentModel.js
│   │   ├── ObligationModel.js
│   │   └── ConfigModel.js
│   ├── controllers/            # Lógica de negocio
│   │   ├── contractController.js
│   │   ├── clientController.js
│   │   └── configController.js
│   ├── routes/                 # Endpoints REST
│   │   ├── contractRoutes.js
│   │   ├── clientRoutes.js
│   │   └── configRoutes.js
│   └── tests/                  # Tests
│       └── contractController.test.js
│
├── src/                        # Frontend React
│   ├── components/
│   │   ├── ContractList.jsx   # Lista de contratos
│   │   ├── ContractForm.jsx   # Formulario con accordion
│   │   ├── SearchForm.jsx      # Búsqueda avanzada
│   │   └── ...
│   ├── services/               # Servicios API
│   │   ├── contractsService.js
│   │   ├── clientsService.js
│   │   └── configService.js
│   └── lib/
│       └── apiClient.js        # Cliente HTTP
│
└── supabase-contracts-setup.sql # Script SQL completo
```

---

## 🗄️ Base de Datos

### Tablas Principales

1. **contracts** - Contratos principales
2. **clients** - Clientes/Contratantes (natural/juridica)
3. **attachments** - Documentos adjuntos
4. **installments** - Cuotas de pago
5. **obligations** - Obligaciones del contrato

### Tablas Configurables

- `tipos_contratos` - Tipos de contrato
- `estados_contratos` - Estados del contrato
- `tipos_documentos` - Tipos de documentos
- `estados_pagos` - Estados de pagos
- `tipos_actividades` - Tipos de actividades
- `productos` - Productos
- `estados_obligaciones` - Estados de obligaciones
- `tipos_identificacion` - Tipos de identificación

### Características

- ✅ **Multi-tenancy**: Cada registro tiene `cliente_id`
- ✅ **RLS Policies**: Aislamiento automático por tenant
- ✅ **Triggers**: Validación suma cuotas ≤ valor contrato
- ✅ **Índices**: Optimización de consultas
- ✅ **Constraints**: Validaciones a nivel BD

---

## 🔌 Backend API

### Endpoints de Contratos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/contracts` | Listar (con filtros y paginación) |
| GET | `/api/contracts/:id` | Obtener uno |
| POST | `/api/contracts` | Crear |
| PUT | `/api/contracts/:id` | Actualizar |
| DELETE | `/api/contracts/:id` | Eliminar |

### Sub-recursos

**Adjuntos:**
- `GET /api/contracts/:id/attachments`
- `POST /api/contracts/:id/attachments`
- `DELETE /api/contracts/:id/attachments/:attachmentId`

**Cuotas:**
- `GET /api/contracts/:id/installments`
- `POST /api/contracts/:id/installments`
- `DELETE /api/contracts/:id/installments/:installmentId`

**Obligaciones:**
- `GET /api/contracts/:id/obligations`
- `POST /api/contracts/:id/obligations`
- `DELETE /api/contracts/:id/obligations/:obligationId`

### Autenticación

Todas las rutas requieren header:
```
Authorization: Bearer <JWT_TOKEN>
```

El token se obtiene de `supabase.auth.getSession()` en el frontend.

### Respuestas

**Éxito:**
```json
{
  "success": true,
  "data": { ... },
  "meta": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje de error",
    "details": { ... }
  }
}
```

---

## 🎨 Frontend

### Componentes Principales

#### ContractList
- Lista de contratos en tabla
- Paginación (10 por página)
- Ordenamiento (click en headers)
- Botones: Crear, Modificar, Eliminar
- Integración con SearchForm

#### ContractForm
- Modal full-screen
- Accordion con secciones:
  - Datos básicos
  - Documentos adjuntos
  - Cuotas de pago
  - Obligaciones
- Validaciones en tiempo real
- Manejo de errores

#### SearchForm
- Búsqueda por número de contrato
- Rango de fechas (desde/hasta)
- Filtro por cliente
- Debounce automático (500ms)

### Uso

```jsx
import { contractsService } from '../services/contractsService'

// Listar contratos
const response = await contractsService.list({
  page: 1,
  limit: 10,
  numero_contrato: 'CT-001'
})

// Crear contrato
const newContract = await contractsService.create({
  numero_contrato: 'CT-001',
  fecha_inicio: '2024-01-01',
  client_id: 'client-123',
  valor_contrato: 1000000,
  objeto_contrato: 'Servicio de desarrollo',
  tipo_contrato_id: 'tipo-1',
  estado_contrato_id: 'estado-1'
})
```

---

## 🧪 Testing

### Backend

```bash
cd backend
npm test
```

Tests incluidos:
- ✅ Listar contratos
- ✅ Crear contrato válido
- ✅ Validaciones de campos obligatorios
- ✅ Prevención de duplicados

---

## 🚢 Despliegue

### Backend (Vercel/Heroku/Railway)

1. **Vercel:**
   ```bash
   cd backend
   vercel
   ```
   Configurar variables de entorno en dashboard.

2. **Heroku:**
   ```bash
   heroku create
   git push heroku main
   heroku config:set SUPABASE_URL=...
   ```

3. **Railway:**
   - Conectar repositorio
   - Configurar variables de entorno
   - Deploy automático

### Frontend (Vercel)

1. Conectar repositorio
2. Configurar variables de entorno:
   - `VITE_API_BASE_URL` → URL del backend
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy automático

---

## 📝 Notas Importantes

### Validaciones

- **Número de contrato**: Único por tenant
- **Suma de cuotas**: ≤ valor del contrato (trigger en BD)
- **Campos obligatorios**: Validados en backend y frontend
- **Tipo + Número identificación**: Único por tenant (clients)

### Multi-tenancy

- Todos los registros filtrados automáticamente por `cliente_id`
- RLS policies en Supabase garantizan aislamiento
- Usuarios solo ven datos de su tenant

### Manejo de Errores

- Backend: Retorna códigos HTTP estándar y mensajes descriptivos
- Frontend: Muestra toasts/modals con mensajes de error
- Errores comunes:
  - `VALIDATION_ERROR` (400)
  - `DUPLICATE_ENTRY` (409)
  - `NOT_FOUND` (404)
  - `UNAUTHORIZED` (401)

---

## 🔧 Troubleshooting

### Error: "Token inválido"
- Verificar que el usuario esté autenticado
- Verificar que `SUPABASE_ANON_KEY` esté correcto

### Error: "No se encontró cliente"
- Verificar que el usuario tenga `cliente_id` en tabla `usuarios`
- Verificar RLS policies

### Error: "CORS"
- Verificar `CORS_ORIGIN` en backend `.env`
- Verificar que el frontend esté en la URL permitida

### Error: "Network Error"
- Verificar que el backend esté corriendo
- Verificar `VITE_API_BASE_URL` en frontend

---

## 📚 Recursos Adicionales

- [Documentación Supabase](https://supabase.com/docs)
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)

---

## ✅ Checklist de Implementación

- [x] Backend MVC completo
- [x] SQL con todas las tablas
- [x] RLS policies
- [x] Validaciones backend
- [x] Servicios frontend
- [x] Componentes React
- [x] Integración en Dashboard
- [x] Tests básicos
- [ ] Tests completos (pendiente)
- [ ] Upload de archivos a Supabase Storage (pendiente)
- [ ] Gestión completa de adjuntos (pendiente)
- [ ] Gestión completa de cuotas (pendiente)
- [ ] Gestión completa de obligaciones (pendiente)

---

## 🎉 ¡Listo!

El sistema está funcional para:
- ✅ Crear y gestionar contratos
- ✅ Buscar y filtrar contratos
- ✅ Ver lista paginada
- ✅ Validaciones básicas

**Próximos pasos sugeridos:**
1. Implementar upload de archivos (Supabase Storage)
2. Completar gestión de adjuntos, cuotas y obligaciones
3. Agregar más tests
4. Mejorar UI/UX

---

**¿Preguntas?** Revisa la guía `GUIA_CONTRATOS_IMPLEMENTACION.md` para más detalles.

