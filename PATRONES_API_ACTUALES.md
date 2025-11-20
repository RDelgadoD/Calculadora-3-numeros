# 📋 Patrones API Actuales en el Proyecto

## 🔍 Análisis del Estado Actual

### ✅ Lo que SÍ tienes:

1. **Cliente Supabase JS directo** desde componentes
2. **Manejo básico de errores** con try/catch
3. **Filtrado por cliente** (multi-tenancy)
4. **Ordenamiento** en algunas consultas

### ❌ Lo que NO tienes (pero deberías):

1. **❌ Patrón RESTful estándar** - No hay endpoints REST propios
2. **❌ Manejo de errores consistente** - Cada componente maneja errores diferente
3. **❌ Paginación** - Las consultas traen TODOS los registros
4. **❌ Capa de servicio/API** - Todo está en los componentes
5. **❌ Formato estándar de respuestas** - Cada componente devuelve datos diferentes
6. **❌ Validación centralizada** - Validaciones dispersas en componentes
7. **❌ Loading states consistentes** - Cada componente maneja loading diferente

---

## 📊 Patrones Actuales Identificados

### 1. **Estructura de Llamadas a Supabase**

```javascript
// Patrón actual (directo en componentes)
const { data, error } = await supabase
  .from('tabla')
  .select('*')
  .eq('campo', valor)
  .order('campo', { ascending: false })

if (error) throw error
// o
if (error) {
  console.error('Error:', error)
  setMensaje('Error al cargar datos')
}
```

**Ubicaciones:**
- `Calculadora.jsx` (línea 94-107)
- `ConsultaOperaciones.jsx` (línea 34-39, 73-96)
- `Admin.jsx` (línea 33-42, 53-62)
- `useUserInfo.js` (línea 17-18)

### 2. **Manejo de Errores (Inconsistente)**

#### Patrón A: Throw error
```javascript
// useUserInfo.js
if (error) throw error
```

#### Patrón B: Console.error + setState
```javascript
// Calculadora.jsx
if (error) {
  console.error('[Calculadora] Error al guardar cálculo:', error)
  setMensajeGuardado(`Error: ${error.message}`)
}
```

#### Patrón C: Try/catch con mensaje genérico
```javascript
// ConsultaOperaciones.jsx
catch (error) {
  console.error('Error al consultar operaciones:', error)
  setMensaje('Error al consultar las operaciones')
}
```

**Problema**: No hay formato estándar, cada componente maneja diferente.

### 3. **Filtrado Multi-Tenant**

```javascript
// Patrón actual (repetido en varios lugares)
.eq('cliente_id', userInfo.clienteId)
```

**Ubicaciones:**
- `ConsultaOperaciones.jsx` (línea 76)
- `Calculadora.jsx` (línea 104)
- `Admin.jsx` (implícito por RLS)

### 4. **Ordenamiento**

```javascript
// Patrón actual
.order('created_at', { ascending: false })
.order('nombre_completo')
```

**Ubicaciones:**
- `ConsultaOperaciones.jsx` (línea 77)
- `Admin.jsx` (línea 36, 56)

### 5. **Loading States**

```javascript
// Patrón actual (inconsistente)
const [cargando, setCargando] = useState(false)
const [loading, setLoading] = useState(false)
const [guardando, setGuardando] = useState(false)
```

**Problema**: Diferentes nombres para el mismo concepto.

---

## 🚨 Problemas Identificados

### 1. **Sin Paginación**

**Problema actual:**
```javascript
// ConsultaOperaciones.jsx - Trae TODOS los registros
const { data, error } = await supabase
  .from('calculos')
  .select('*')  // ❌ Sin límite
```

**Impacto:**
- Si hay 10,000 registros, se cargan todos
- Lento en producción
- Alto consumo de memoria

### 2. **Sin Manejo de Errores Estándar**

**Problema actual:**
- Errores de red no se manejan
- Errores de validación mezclados con errores de BD
- No hay códigos de error estándar

### 3. **Lógica de Negocio en Componentes**

**Problema actual:**
- Los componentes tienen lógica de BD
- Difícil de testear
- Difícil de reutilizar

### 4. **Sin Validación Centralizada**

**Problema actual:**
- Validaciones dispersas en cada componente
- No hay validación de tipos
- No hay validación de permisos centralizada

---

## 📈 Propuesta de Mejoras

### Opción 1: Servicio/API Layer (RECOMENDADO)

Crear una capa de servicios que encapsule todas las llamadas a Supabase:

```
src/
  services/
    calculosService.js      # Operaciones con cálculos
    usuariosService.js      # Operaciones con usuarios
    clientesService.js      # Operaciones con clientes
    apiClient.js            # Cliente base con manejo de errores
```

**Ventajas:**
- ✅ Código reutilizable
- ✅ Manejo de errores centralizado
- ✅ Fácil de testear
- ✅ Fácil de mantener

### Opción 2: Custom Hooks

Crear hooks personalizados para cada entidad:

```
src/
  hooks/
    useCalculos.js
    useUsuarios.js
    useClientes.js
```

**Ventajas:**
- ✅ Integrado con React
- ✅ Manejo de estado automático
- ✅ Fácil de usar en componentes

### Opción 3: Combinación (Servicios + Hooks)

**Mejor opción**: Servicios para lógica de negocio + Hooks para estado de React.

---

## 🎯 Estándares Propuestos

### 1. **Formato de Respuesta Estándar**

```javascript
// Éxito
{
  success: true,
  data: [...],
  meta: {
    total: 100,
    page: 1,
    limit: 20
  }
}

// Error
{
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'El email es obligatorio',
    details: {...}
  }
}
```

### 2. **Códigos de Error Estándar**

```javascript
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
}
```

### 3. **Paginación Estándar**

```javascript
{
  page: 1,        // Página actual
  limit: 20,      // Registros por página
  total: 100,     // Total de registros
  totalPages: 5   // Total de páginas
}
```

---

## 📝 Ejemplo de Implementación Propuesta

Ver archivos:
- `src/services/apiClient.js` - Cliente base
- `src/services/calculosService.js` - Servicio de cálculos
- `src/hooks/useCalculos.js` - Hook para usar en componentes

---

## ✅ Checklist de Mejoras

- [ ] Crear capa de servicios
- [ ] Implementar manejo de errores estándar
- [ ] Agregar paginación a todas las listas
- [ ] Crear hooks personalizados
- [ ] Validación centralizada
- [ ] Documentar estándares de API
- [ ] Agregar tests para servicios


