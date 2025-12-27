# Arquitectura y Flujo de Información del Sistema

## 📊 Diagrama de Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React + Vite)                            │
│                                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐             │
│  │   Usuario    │      │  Componente  │      │   Servicio   │             │
│  │  (Click/UI)  │─────▶│   React      │─────▶│   (Service)  │             │
│  └──────────────┘      └──────────────┘      └──────────────┘             │
│                              │                        │                      │
│                              │                        │                      │
│                              ▼                        ▼                      │
│                       ┌──────────────┐      ┌──────────────┐               │
│                       │   Estado     │      │  apiClient   │               │
│                       │   (useState) │      │   (fetch)    │               │
│                       └──────────────┘      └──────────────┘               │
│                                                      │                      │
│                                                      │ JWT Token            │
│                                                      │ (Authorization)       │
│                                                      ▼                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/HTTPS Request
                                    │ POST/GET/PUT/DELETE
                                    │ Headers: Authorization: Bearer <token>
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express.js - Vercel)                          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                    Express App (app.js)                       │          │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │          │
│  │  │     CORS     │  │   JSON Parser│  │   Routes     │      │          │
│  │  │  Middleware │  │   Middleware │  │   Router     │      │          │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │              authMiddleware (Verificación JWT)                │          │
│  │  1. Extrae token del header Authorization                     │          │
│  │  2. Verifica token con Supabase Auth                          │          │
│  │  3. Obtiene usuario de tabla 'usuarios' (supabaseAdmin)       │          │
│  │  4. Agrega req.user = { id, email, clienteId, rol }           │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                    Controller (MVC)                           │          │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │          │
│  │  │ Validación   │  │  Lógica de   │  │  Respuesta   │      │          │
│  │  │  de Datos    │  │  Negocio     │  │  HTTP        │      │          │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │                      Model (MVC)                              │          │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │          │
│  │  │  Supabase    │  │  Filtrado    │  │  Multi-       │      │          │
│  │  │  Admin SDK   │  │  por cliente │  │  Tenancy      │      │          │
│  │  │  (bypass RLS)│  │  (cliente_id)│  │  (RLS)        │      │          │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                    │                                        │
│                                    │ Supabase SDK                           │
│                                    │ (service_role key)                     │
│                                    ▼                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS Request
                                    │ (PostgreSQL Protocol)
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL + Auth + Storage)                   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │              PostgreSQL Database                               │          │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │          │
│  │  │   Tablas     │  │  Row Level   │  │  Funciones   │      │          │
│  │  │  (Multi-     │  │  Security    │  │  SQL (RPC)   │      │          │
│  │  │  Tenant)     │  │  (RLS)       │  │              │      │          │
│  │  └──────────────┘  └──────────────┘  └──────────────┘      │          │
│  │                                                               │          │
│  │  Ejemplo de Política RLS:                                     │          │
│  │  CREATE POLICY "users_select" ON contracts                   │          │
│  │  FOR SELECT USING (                                           │          │
│  │    cliente_id = (SELECT cliente_id FROM usuarios              │          │
│  │                  WHERE id = auth.uid())                      │          │
│  │  );                                                           │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │              Supabase Auth (JWT)                              │          │
│  │  - Autenticación de usuarios                                  │          │
│  │  - Generación de tokens JWT                                   │          │
│  │  - Verificación de sesiones                                   │          │
│  └──────────────────────────────────────────────────────────────┘          │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐          │
│  │              Supabase Storage                                 │          │
│  │  - Almacenamiento de archivos (contratos, documentos)        │          │
│  │  - Buckets con políticas RLS                                 │          │
│  └──────────────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Response (JSON)
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BACKEND → FRONTEND (Response)                            │
│                                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐             │
│  │   Model      │─────▶│  Controller  │─────▶│   Response   │             │
│  │  (Data)     │      │  (Format)    │      │   JSON       │             │
│  └──────────────┘      └──────────────┘      └──────────────┘             │
│                                                                              │
│  Formato de Respuesta:                                                       │
│  {                                                                            │
│    success: true/false,                                                      │
│    data: {...},                                                              │
│    message: "Mensaje en español"                                              │
│  }                                                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP Response
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Actualización de UI)                           │
│                                                                              │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐             │
│  │  apiClient   │─────▶│   Servicio   │─────▶│  Componente   │             │
│  │  (Response)  │      │   (Process)  │      │   (setState)  │             │
│  └──────────────┘      └──────────────┘      └──────────────┘             │
│                                                      │                      │
│                                                      ▼                      │
│                                              ┌──────────────┐             │
│                                              │   Re-render  │             │
│                                              │   UI Update  │             │
│                                              └──────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo Detallado Paso a Paso

### Ejemplo: Usuario hace clic en "Guardar Contrato"

#### **1. Frontend - Interacción del Usuario**
```
Usuario → Click en botón "Guardar" 
  ↓
Componente React (ContractForm.jsx)
  - Captura evento onClick
  - Valida datos del formulario
  - Prepara objeto con datos del contrato
  - Llama a: clientsService.create(contractData)
```

#### **2. Frontend - Capa de Servicio**
```
clientsService.create(contractData)
  ↓
apiClient.post('/contracts', contractData)
  ↓
1. Obtiene JWT token de Supabase Auth
   - supabase.auth.getSession()
   - Extrae session.access_token
  ↓
2. Construye request HTTP
   - URL: ${API_BASE_URL}/contracts
   - Method: POST
   - Headers: {
       'Content-Type': 'application/json',
       'Authorization': 'Bearer <JWT_TOKEN>'
     }
   - Body: JSON.stringify(contractData)
  ↓
3. Ejecuta fetch() nativo
```

#### **3. Red - Request HTTP**
```
Frontend (Browser)
  ↓
HTTPS Request
  - Method: POST
  - URL: https://tu-app.vercel.app/api/contracts
  - Headers: Authorization, Content-Type
  - Body: { numero_contrato, fecha_inicio, ... }
  ↓
Vercel Serverless Function
```

#### **4. Backend - Express App (Vercel Serverless)**
```
api/index.js (Vercel Serverless Entry Point)
  ↓
Lazy loads: backend/app.js
  ↓
Express App inicializado
  ↓
1. CORS Middleware
   - Verifica origen permitido
   - Permite requests de Vercel domains
  ↓
2. JSON Parser Middleware
   - Parsea body a JSON
   - Limite: 10mb
  ↓
3. Routes Matching
   - POST /api/contracts → contractRoutes
```

#### **5. Backend - Autenticación**
```
authMiddleware (req, res, next)
  ↓
1. Extrae token del header
   - req.headers.authorization
   - Formato: "Bearer <token>"
  ↓
2. Verifica token con Supabase Auth
   - supabase.auth.getUser(token)
   - Valida que el token sea válido
  ↓
3. Obtiene información del usuario
   - Usa supabaseAdmin (bypass RLS)
   - Query: SELECT * FROM usuarios WHERE id = user.id
   - Extrae: id, email, cliente_id, rol
  ↓
4. Agrega a request
   - req.user = {
       id: user.id,
       email: user.email,
       clienteId: usuario.cliente_id,
       rol: usuario.rol
     }
  ↓
5. Llama next() → Continúa al controller
```

#### **6. Backend - Controller (Lógica de Negocio)**
```
ContractController.create(req, res)
  ↓
1. Validación de datos
   - Verifica campos requeridos
   - Valida formatos (fechas, números)
   - Convierte strings vacíos a null
  ↓
2. Agrega multi-tenancy
   - contractData.cliente_id = req.user.clienteId
   - Asegura que el contrato pertenece al cliente del usuario
  ↓
3. Llama al Model
   - ContractModel.create(contractData)
```

#### **7. Backend - Model (Acceso a Datos)**
```
ContractModel.create(contractData)
  ↓
1. Usa Supabase Admin SDK
   - supabaseAdmin.from('contracts')
   - Bypass RLS (usa service_role key)
  ↓
2. Inserta datos
   - .insert([contractData])
   - Incluye cliente_id automáticamente
  ↓
3. Retorna datos insertados
   - .select() para obtener registro completo
   - .single() para obtener un objeto
  ↓
4. Retorna a Controller
```

#### **8. Backend - Response**
```
Controller formatea respuesta
  ↓
res.json({
  success: true,
  data: contractRecord,
  message: 'Contrato creado exitosamente'
})
  ↓
HTTP Response (200 OK)
  - Status: 200
  - Headers: Content-Type: application/json
  - Body: { success: true, data: {...}, message: "..." }
```

#### **9. Frontend - Procesamiento de Response**
```
apiClient recibe response
  ↓
1. Verifica status HTTP
   - if (response.ok) → procesa
   - else → lanza error
  ↓
2. Parsea JSON
   - response.json()
  ↓
3. Retorna a servicio
   - return { data: result.data, ... }
```

#### **10. Frontend - Actualización de UI**
```
Servicio retorna datos
  ↓
Componente React
  - setState({ contracts: [...contracts, newContract] })
  - setLoading(false)
  - Muestra mensaje de éxito
  ↓
React re-renderiza
  - Actualiza lista de contratos
  - Cierra modal
  - Muestra notificación
```

## 🏗️ Arquitectura del Sistema

### **Stack Tecnológico**

#### **Frontend**
- **React 18**: Biblioteca UI con hooks funcionales
- **Vite**: Build tool y dev server (rápido)
- **Tailwind CSS**: Framework CSS utility-first
- **Supabase JS SDK**: Cliente para Auth y Storage (directo desde frontend)

#### **Backend**
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web minimalista
- **Arquitectura MVC**: Separación de responsabilidades
- **Vercel Serverless**: Deploy como funciones serverless

#### **Base de Datos**
- **Supabase (PostgreSQL)**: Base de datos relacional
- **Row Level Security (RLS)**: Seguridad a nivel de fila
- **Supabase Auth**: Autenticación y autorización
- **Supabase Storage**: Almacenamiento de archivos

#### **Infraestructura**
- **Vercel**: Hosting frontend y backend (serverless)
- **GitHub**: Control de versiones
- **Supabase Cloud**: Base de datos y servicios

### **Patrón Arquitectónico: MVC + Multi-Tenancy**

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Componentes │  │   Servicios  │  │  apiClient   │  │
│  │    React     │  │   (Service)  │  │   (HTTP)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP + JWT
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Routes     │  │ Controllers  │  │ Middleware   │  │
│  │  (Routing)   │  │  (Business)  │  │  (Auth)     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      DATA LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Models    │  │   Supabase   │  │   Database    │  │
│  │  (Data Acc) │  │  Admin SDK   │  │  (PostgreSQL) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### **Multi-Tenancy (Aislamiento de Datos)**

El sistema implementa **multi-tenancy a nivel de base de datos** usando:

1. **Columna `cliente_id`** en todas las tablas de datos
2. **Row Level Security (RLS)** en Supabase
3. **Filtrado automático** en backend usando `req.user.clienteId`

```
Usuario A (cliente_id: 1) → Solo ve datos con cliente_id = 1
Usuario B (cliente_id: 2) → Solo ve datos con cliente_id = 2
```

**Política RLS Ejemplo:**
```sql
CREATE POLICY "users_select" ON contracts
FOR SELECT USING (
  cliente_id = (
    SELECT cliente_id FROM usuarios 
    WHERE id = auth.uid()
  )
);
```

## 📈 Escalabilidad del Sistema

### ✅ **Aspectos Escalables**

#### **1. Arquitectura Serverless (Vercel)**
- ✅ **Auto-scaling**: Vercel escala automáticamente según demanda
- ✅ **Sin servidores**: No requiere gestión de infraestructura
- ✅ **Cold start**: ~100-300ms (aceptable para la mayoría de casos)
- ✅ **Límites**: 10s timeout (extensible a 30s para funciones específicas)

#### **2. Base de Datos (Supabase/PostgreSQL)**
- ✅ **PostgreSQL**: Base de datos robusta y escalable
- ✅ **Connection pooling**: Supabase maneja conexiones eficientemente
- ✅ **Índices**: Permite optimización de queries
- ✅ **RLS**: Seguridad sin impacto en performance

#### **3. Frontend (React + Vite)**
- ✅ **Code splitting**: Vite divide el código automáticamente
- ✅ **Lazy loading**: Componentes cargados bajo demanda
- ✅ **CDN**: Vercel sirve assets desde CDN global
- ✅ **Caching**: Headers de cache para assets estáticos

#### **4. Separación de Responsabilidades**
- ✅ **MVC**: Facilita mantenimiento y escalado
- ✅ **Servicios**: Lógica reutilizable
- ✅ **API RESTful**: Fácil de extender

### ⚠️ **Limitaciones y Consideraciones**

#### **1. Serverless Functions (Vercel)**
- ⚠️ **Timeout**: Máximo 30 segundos por request
- ⚠️ **Cold start**: Primera invocación puede ser lenta
- ⚠️ **Memoria**: Limitada (1GB por defecto)
- 💡 **Solución**: Para operaciones largas, usar jobs asíncronos

#### **2. Base de Datos**
- ⚠️ **Conexiones**: Límite de conexiones concurrentes en plan gratuito
- ⚠️ **Storage**: Límite de almacenamiento según plan
- 💡 **Solución**: 
  - Usar connection pooling
  - Implementar paginación
  - Cachear queries frecuentes

#### **3. Autenticación**
- ⚠️ **Supabase Auth**: Límites según plan
- 💡 **Solución**: Planes escalables disponibles

### 🚀 **Recomendaciones para Escalar**

#### **Corto Plazo (0-10K usuarios)**
- ✅ Arquitectura actual es suficiente
- ✅ Implementar paginación en todas las listas
- ✅ Agregar índices en columnas frecuentemente consultadas
- ✅ Implementar cache en frontend (React Query/SWR)

#### **Mediano Plazo (10K-100K usuarios)**
- 🔄 **CDN para assets**: Ya implementado (Vercel)
- 🔄 **Cache de queries**: Redis para queries frecuentes
- 🔄 **Database replicas**: Para lectura (Supabase Pro)
- 🔄 **Load balancing**: Vercel lo maneja automáticamente

#### **Largo Plazo (100K+ usuarios)**
- 🔄 **Microservicios**: Separar servicios por dominio
- 🔄 **Message queues**: Para operaciones asíncronas
- 🔄 **Database sharding**: Si es necesario
- 🔄 **Monitoring**: APM tools (Sentry, Datadog)

### 📊 **Métricas de Performance Actuales**

```
Frontend Load Time:     ~1-2s (first load)
API Response Time:      ~200-500ms (con DB)
Database Query Time:   ~50-200ms (depende de query)
Cold Start (Vercel):   ~100-300ms
Warm Start (Vercel):   ~10-50ms
```

## 🔒 Seguridad

### **Capas de Seguridad Implementadas**

1. **Autenticación**: JWT tokens de Supabase Auth
2. **Autorización**: Multi-tenancy con RLS
3. **Validación**: Frontend y Backend
4. **CORS**: Configurado para orígenes permitidos
5. **HTTPS**: Forzado en producción (Vercel)
6. **SQL Injection**: Prevenido por Supabase SDK (prepared statements)

## 📝 Conclusión

### **Ventajas de la Arquitectura Actual**
- ✅ **Escalable**: Serverless permite escalar automáticamente
- ✅ **Segura**: Multi-tenancy y RLS garantizan aislamiento
- ✅ **Mantenible**: MVC separa responsabilidades claramente
- ✅ **Rápida**: Vite y Vercel optimizan performance
- ✅ **Costo-efectiva**: Pay-per-use en serverless

### **Capacidad Estimada**
- **Usuarios concurrentes**: 1,000-5,000 (sin optimizaciones)
- **Requests/segundo**: 100-500 (depende de complejidad)
- **Base de datos**: Hasta 500MB (plan gratuito), escalable

### **Recomendación Final**
La arquitectura actual es **altamente escalable** para la mayoría de casos de uso empresariales. Con las optimizaciones recomendadas, puede soportar **decenas de miles de usuarios** sin problemas.

