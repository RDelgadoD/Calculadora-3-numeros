# 📚 Ejemplo de Uso de Servicios y Hooks

## 🎯 Antes vs Después

### ❌ ANTES (Código actual en componentes)

```javascript
// Calculadora.jsx - Código actual
const guardarCalculo = async (n1, n2, n3, operacion, resultado) => {
  setGuardando(true)
  setMensajeGuardado(null)

  try {
    if (!userInfo?.clienteId) {
      throw new Error('El usuario no tiene cliente asignado')
    }

    const { data, error } = await supabase
      .from('calculos')
      .insert([
        {
          numero1: n1,
          numero2: n2,
          numero3: n3,
          operacion: operacion,
          resultado: resultado.toString(),
          user_id: user.id,
          cliente_id: userInfo.clienteId
        }
      ])
      .select()

    if (error) {
      console.error('[Calculadora] Error al guardar cálculo:', error)
      setMensajeGuardado(`Error al guardar el cálculo: ${error.message || error.details || 'desconocido'}`)
    } else {
      setMensajeGuardado('✓ Cálculo guardado exitosamente')
      setTimeout(() => setMensajeGuardado(null), 3000)
    }
  } catch (error) {
    console.error('[Calculadora] Error inesperado al guardar cálculo:', error)
    setMensajeGuardado(`Error inesperado al guardar el cálculo: ${error.message}`)
  } finally {
    setGuardando(false)
  }
}
```

### ✅ DESPUÉS (Usando servicios)

```javascript
// Calculadora.jsx - Con servicios
import { crearCalculo } from '../services/calculosService'

const guardarCalculo = async (n1, n2, n3, operacion, resultado) => {
  setGuardando(true)
  setMensajeGuardado(null)

  const response = await crearCalculo({
    numero1: n1,
    numero2: n2,
    numero3: n3,
    operacion: operacion,
    resultado: resultado.toString(),
    user_id: user.id
  }, userInfo.clienteId)

  if (response.success) {
    setMensajeGuardado('✓ Cálculo guardado exitosamente')
    setTimeout(() => setMensajeGuardado(null), 3000)
  } else {
    setMensajeGuardado(`Error: ${response.error.message}`)
  }

  setGuardando(false)
}
```

---

## 📖 Ejemplos de Uso

### 1. **Usar Hook para Cálculos**

```javascript
// ConsultaOperaciones.jsx
import { useCalculos } from '../hooks/useCalculos'

function ConsultaOperaciones({ userInfo }) {
  const [filtros, setFiltros] = useState({
    userId: null,
    fechaInicio: null,
    fechaFin: null,
    page: 1
  })

  const {
    calculos,
    loading,
    error,
    pagination,
    refetch
  } = useCalculos({
    clienteId: userInfo.clienteId,
    userId: filtros.userId,
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin,
    page: filtros.page,
    limit: 20
  })

  // El hook maneja automáticamente:
  // - Loading state
  // - Error handling
  // - Paginación
  // - Recarga cuando cambian los filtros

  return (
    <div>
      {loading && <p>Cargando...</p>}
      {error && <p>Error: {error}</p>}
      {calculos.map(calc => (
        <div key={calc.id}>{calc.resultado}</div>
      ))}
      <button onClick={() => setFiltros({ ...filtros, page: pagination.page + 1 })}>
        Siguiente página
      </button>
    </div>
  )
}
```

### 2. **Usar Servicio Directamente**

```javascript
// Admin.jsx
import { obtenerUsuarios, crearUsuario, actualizarUsuario } from '../services/usuariosService'

const cargarUsuarios = async () => {
  setLoading(true)

  const response = await obtenerUsuarios({
    clienteId: userInfo.clienteId,
    page: 1,
    limit: 50
  })

  if (response.success) {
    setUsuarios(response.data)
    setPagination(response.meta)
  } else {
    setError(response.error.message)
  }

  setLoading(false)
}

const guardarUsuario = async (usuarioData) => {
  setGuardando(true)

  let response
  if (usuarioEnEdicion) {
    response = await actualizarUsuario(usuarioEnEdicion.id, usuarioData)
  } else {
    response = await crearUsuario(usuarioData)
  }

  if (response.success) {
    setMensaje('Usuario guardado correctamente')
    await cargarUsuarios() // Recargar lista
  } else {
    setError(response.error.message)
  }

  setGuardando(false)
}
```

### 3. **Manejo de Errores Estándar**

```javascript
// Todos los servicios devuelven el mismo formato
const response = await crearCalculo(data, clienteId)

if (response.success) {
  // ✅ Éxito
  console.log('Datos:', response.data)
  console.log('Meta:', response.meta)
} else {
  // ❌ Error
  console.error('Código:', response.error.code)
  console.error('Mensaje:', response.error.message)
  console.error('Detalles:', response.error.details)

  // Manejar según código de error
  switch (response.error.code) {
    case 'VALIDATION_ERROR':
      alert('Error de validación: ' + response.error.message)
      break
    case 'UNAUTHORIZED':
      // Redirigir a login
      window.location.href = '/login'
      break
    case 'FORBIDDEN':
      alert('No tienes permisos para esta acción')
      break
    default:
      alert('Error: ' + response.error.message)
  }
}
```

### 4. **Paginación**

```javascript
const {
  calculos,
  pagination,
  refetch
} = useCalculos({
  clienteId: userInfo.clienteId,
  page: 1,
  limit: 20
})

// pagination contiene:
// {
//   page: 1,
//   limit: 20,
//   total: 150,
//   totalPages: 8,
//   hasNextPage: true,
//   hasPrevPage: false
// }

// Navegar a siguiente página
const siguientePagina = () => {
  if (pagination.hasNextPage) {
    refetch({ page: pagination.page + 1 })
  }
}

// Navegar a página anterior
const paginaAnterior = () => {
  if (pagination.hasPrevPage) {
    refetch({ page: pagination.page - 1 })
  }
}
```

---

## 🔄 Migración Gradual

No necesitas cambiar todo de una vez. Puedes migrar componente por componente:

1. **Paso 1**: Crear servicios (ya hecho)
2. **Paso 2**: Migrar un componente (ej: `Calculadora.jsx`)
3. **Paso 3**: Probar que funciona
4. **Paso 4**: Migrar siguiente componente
5. **Paso 5**: Repetir hasta completar

---

## ✅ Ventajas de Usar Servicios

1. **Código más limpio**: Los componentes solo manejan UI
2. **Reutilizable**: Mismo servicio en múltiples componentes
3. **Testeable**: Fácil de testear servicios sin UI
4. **Mantenible**: Cambios en un solo lugar
5. **Consistente**: Mismo formato de errores en toda la app
6. **Paginación**: Automática en todas las listas
7. **Type-safe**: Fácil agregar TypeScript después


