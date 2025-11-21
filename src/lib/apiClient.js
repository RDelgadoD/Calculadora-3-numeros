/**
 * Cliente API para consumir el backend Express
 * Usa fetch nativo
 */

import { supabase } from './supabase'

// Obtener la URL base de la API
const envApiUrl = import.meta.env.VITE_API_BASE_URL

// Determinar la URL base según el entorno
let API_BASE_URL = envApiUrl

if (!API_BASE_URL) {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    // En producción (Vercel), usar la URL actual del navegador + /api
    API_BASE_URL = `${window.location.origin}/api`
    console.log('[API Client] 🌐 Producción: Usando URL del navegador:', API_BASE_URL)
  } else {
    // En desarrollo, usar localhost
    API_BASE_URL = 'http://localhost:3001/api'
    console.log('[API Client] 💻 Desarrollo: Usando localhost:', API_BASE_URL)
  }
} else {
  console.log('[API Client] ✅ Usando VITE_API_BASE_URL:', API_BASE_URL)
}

// Logging detallado para diagnóstico
console.log('[API Client] ==========================================')
console.log('[API Client] Configuración:')
console.log('[API Client]   - VITE_API_BASE_URL:', envApiUrl || '(no definida)')
console.log('[API Client]   - API_BASE_URL final:', API_BASE_URL)
console.log('[API Client]   - PROD:', import.meta.env.PROD)
console.log('[API Client]   - MODE:', import.meta.env.MODE)
console.log('[API Client]   - window.location.origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A')
console.log('[API Client] ==========================================')

// Validar que en producción no esté usando localhost (solo si no usamos la URL del navegador como fallback)
if (import.meta.env.PROD && API_BASE_URL.includes('localhost') && envApiUrl) {
  console.error('❌ ERROR CRÍTICO: VITE_API_BASE_URL está configurada como localhost en producción.')
  console.error('   Valor de import.meta.env.VITE_API_BASE_URL:', envApiUrl)
  console.error('   API_BASE_URL final:', API_BASE_URL)
}

/**
 * Obtener token JWT de Supabase
 */
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    throw new Error('No hay sesión activa')
  }
  return session.access_token
}

/**
 * Verificar si el backend está disponible
 */
let backendAvailable = null
let lastCheck = 0
const CHECK_INTERVAL = 30000 // 30 segundos

const checkBackendAvailability = async () => {
  const now = Date.now()
  // Solo verificar cada 30 segundos para no saturar
  if (backendAvailable !== null && (now - lastCheck) < CHECK_INTERVAL) {
    return backendAvailable
  }

  lastCheck = now
  try {
    // API_BASE_URL ya incluye /api, así que solo necesitamos /health
    const healthUrl = API_BASE_URL.endsWith('/api') 
      ? `${API_BASE_URL}/health` 
      : `${API_BASE_URL}/api/health`
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(3000) // Timeout de 3 segundos
    })
    backendAvailable = response.ok
    if (backendAvailable) {
      console.log('[API Client] ✅ Backend disponible')
    } else {
      console.log('[API Client] ⚠️ Backend no disponible (status:', response.status, ')')
    }
    return backendAvailable
  } catch (error) {
    backendAvailable = false
    console.log('[API Client] ⚠️ Backend no disponible:', error.message)
    return false
  }
}

/**
 * Realizar petición a la API
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    // Verificar si el backend está disponible
    const isAvailable = await checkBackendAvailability()
    
    if (!isAvailable && !import.meta.env.PROD) {
      // En desarrollo, si el backend no está disponible, lanzar error claro
      throw {
        code: 'BACKEND_NOT_RUNNING',
        message: `El servidor backend no está corriendo en ${API_BASE_URL}. Por favor, inicia el servidor ejecutando: cd backend && npm run dev`,
        status: 0,
        url: `${API_BASE_URL}${endpoint}`
      }
    }

    const token = await getAuthToken()
    const url = `${API_BASE_URL}${endpoint}`
    
    console.log(`[API] 📤 Petición: ${options.method || 'GET'} ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      signal: AbortSignal.timeout(10000) // Timeout de 10 segundos
    })

    console.log(`[API] 📥 Respuesta: ${response.status} ${response.statusText}`)

    // Si la respuesta no es JSON, intentar leer como texto primero
    const contentType = response.headers.get('content-type')
    let data
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      console.error(`[API] ❌ Respuesta no es JSON: ${text.substring(0, 200)}`)
      throw {
        code: 'INVALID_RESPONSE',
        message: `El servidor respondió con un formato inesperado: ${response.status} ${response.statusText}`,
        status: response.status,
        details: text.substring(0, 200)
      }
    }

    if (!response.ok) {
      console.error(`[API] ❌ Error en la respuesta:`, data)
      throw {
        code: data.error?.code || 'API_ERROR',
        message: data.error?.message || 'Error en la petición',
        details: data.error?.details || null,
        status: response.status
      }
    }

    console.log(`[API] ✅ Éxito`)
    return data
  } catch (error) {
    console.error(`[API] ❌ Error:`, error)
    
    // Si es un error de red o timeout
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      let errorMessage = `Error de conexión. No se pudo conectar a ${API_BASE_URL}.`
      
      if (!import.meta.env.PROD) {
        errorMessage += `\n\nEn desarrollo local, asegúrate de que el backend esté corriendo:\n` +
          `  1. Abre una terminal\n` +
          `  2. Ejecuta: cd backend\n` +
          `  3. Ejecuta: npm run dev\n` +
          `  4. El servidor debería iniciar en http://localhost:3001`
      } else {
        errorMessage += ` Verifica que VITE_API_BASE_URL esté configurada correctamente en Vercel.`
      }
      
      throw {
        code: 'NETWORK_ERROR',
        message: errorMessage,
        status: 0,
        url: `${API_BASE_URL}${endpoint}`
      }
    }

    // Si es un error de timeout
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw {
        code: 'TIMEOUT_ERROR',
        message: `La petición tardó demasiado tiempo. El servidor puede estar sobrecargado o no disponible.`,
        status: 0,
        url: `${API_BASE_URL}${endpoint}`
      }
    }
    
    // Si ya es un error formateado, lanzarlo tal cual
    if (error.code) {
      throw error
    }
    
    // Error genérico
    throw {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Error desconocido al realizar la petición',
      status: 0,
      originalError: error.toString()
    }
  }
}

/**
 * Métodos HTTP
 */
export const api = {
  get: (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    return apiRequest(url, { method: 'GET' })
  },

  post: (endpoint, body) => {
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    })
  },

  put: (endpoint, body) => {
    return apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    })
  },

  delete: (endpoint) => {
    return apiRequest(endpoint, { method: 'DELETE' })
  }
}

export default api
