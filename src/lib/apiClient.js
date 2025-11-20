/**
 * Cliente API para consumir el backend Express
 * Usa fetch nativo
 */

import { supabase } from './supabase'

// Obtener la URL base de la API
const envApiUrl = import.meta.env.VITE_API_BASE_URL

// Si estamos en producción y no hay variable configurada, intentar usar la URL actual
let API_BASE_URL = envApiUrl
if (!API_BASE_URL) {
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    // En producción, usar la URL actual del navegador + /api
    API_BASE_URL = `${window.location.origin}/api`
    console.warn('[API Client] ⚠️ VITE_API_BASE_URL no está configurada. Usando URL actual del navegador:', API_BASE_URL)
  } else {
    // En desarrollo, usar localhost
    API_BASE_URL = 'http://localhost:3001/api'
  }
}

// Logging detallado para diagnóstico
console.log('[API Client] Inicializando...')
console.log('[API Client] import.meta.env.VITE_API_BASE_URL:', envApiUrl || '(no definida)')
console.log('[API Client] API_BASE_URL final:', API_BASE_URL)
console.log('[API Client] import.meta.env.PROD:', import.meta.env.PROD)
console.log('[API Client] import.meta.env.MODE:', import.meta.env.MODE)
console.log('[API Client] window.location.origin:', typeof window !== 'undefined' ? window.location.origin : 'N/A')

// Validar que en producción no esté usando localhost (solo si no usamos la URL del navegador como fallback)
if (import.meta.env.PROD && API_BASE_URL.includes('localhost') && envApiUrl) {
  console.error('❌ ERROR CRÍTICO: VITE_API_BASE_URL está configurada como localhost en producción.')
  console.error('   Valor de import.meta.env.VITE_API_BASE_URL:', envApiUrl)
  console.error('   API_BASE_URL final:', API_BASE_URL)
  console.error('   SOLUCIÓN:')
  console.error('   1. Ve a Vercel Settings > Environment Variables')
  console.error('   2. Edita VITE_API_BASE_URL y cámbiala a: https://calculadora-3-numeros.vercel.app/api')
  console.error('   3. Asegúrate de que esté en Production, Preview y Development')
  console.error('   4. Haz un NUEVO DEPLOY (las variables VITE_* se inyectan en tiempo de build)')
} else if (import.meta.env.PROD && !envApiUrl) {
  console.warn('⚠️ ADVERTENCIA: VITE_API_BASE_URL no está configurada en Vercel.')
  console.warn('   Usando URL actual del navegador como fallback:', API_BASE_URL)
  console.warn('   RECOMENDACIÓN: Configura VITE_API_BASE_URL en Vercel para mejor rendimiento.')
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
 * Realizar petición a la API
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken()
    const url = `${API_BASE_URL}${endpoint}`
    
    console.log(`[API] Haciendo petición a: ${url}`)
    console.log(`[API] API_BASE_URL configurada: ${API_BASE_URL}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })

    console.log(`[API] Respuesta recibida: ${response.status} ${response.statusText}`)

    // Si la respuesta no es JSON, intentar leer como texto primero
    const contentType = response.headers.get('content-type')
    let data
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      const text = await response.text()
      console.error(`[API] Respuesta no es JSON: ${text}`)
      throw {
        code: 'INVALID_RESPONSE',
        message: `El servidor respondió con un formato inesperado: ${response.status} ${response.statusText}`,
        status: response.status,
        details: text.substring(0, 200)
      }
    }

    if (!response.ok) {
      console.error(`[API] Error en la respuesta:`, data)
      throw {
        code: data.error?.code || 'API_ERROR',
        message: data.error?.message || 'Error en la petición',
        details: data.error?.details || null,
        status: response.status
      }
    }

    return data
  } catch (error) {
    console.error(`[API] Error en la petición:`, error)
    
    // Si es un error de red
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error(`[API] Error de red. URL intentada: ${API_BASE_URL}${endpoint}`)
      
      let errorMessage = `Error de conexión. No se pudo conectar a ${API_BASE_URL}.`
      
      // Si está usando localhost en producción, dar mensaje más específico
      if (import.meta.env.PROD && API_BASE_URL.includes('localhost')) {
        errorMessage = `Error de configuración: VITE_API_BASE_URL está configurada como "${API_BASE_URL}" (localhost). ` +
          `En Vercel, ve a Settings > Environment Variables y configura VITE_API_BASE_URL con el valor: ` +
          `https://calculadora-3-numeros.vercel.app/api. Después, haz un redeploy.`
      } else {
        errorMessage += ` Verifica que el servidor esté corriendo y que VITE_API_BASE_URL esté configurada correctamente.`
      }
      
      throw {
        code: 'NETWORK_ERROR',
        message: errorMessage,
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


