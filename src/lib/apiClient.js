/**
 * Cliente API para consumir el backend Express
 * Usa fetch nativo
 */

import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

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
      throw {
        code: 'NETWORK_ERROR',
        message: `Error de conexión. No se pudo conectar a ${API_BASE_URL}. Verifica que el servidor esté corriendo y que VITE_API_BASE_URL esté configurada correctamente.`,
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


