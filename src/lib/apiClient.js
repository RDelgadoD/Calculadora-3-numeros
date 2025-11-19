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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw {
        code: data.error?.code || 'API_ERROR',
        message: data.error?.message || 'Error en la petición',
        details: data.error?.details || null,
        status: response.status
      }
    }

    return data
  } catch (error) {
    // Si es un error de red
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw {
        code: 'NETWORK_ERROR',
        message: 'Error de conexión. Verifica que el servidor esté corriendo.',
        status: 0
      }
    }
    throw error
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


