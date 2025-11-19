/**
 * Cliente base para llamadas a Supabase
 * Proporciona manejo de errores consistente y formato estándar de respuestas
 */

import { supabase } from '../lib/supabase'

/**
 * Códigos de error estándar
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

/**
 * Formato estándar de respuesta de éxito
 */
export const createSuccessResponse = (data, meta = {}) => ({
  success: true,
  data,
  meta
})

/**
 * Formato estándar de respuesta de error
 */
export const createErrorResponse = (code, message, details = null) => ({
  success: false,
  error: {
    code,
    message,
    details
  }
})

/**
 * Maneja errores de Supabase y los convierte a formato estándar
 */
export const handleSupabaseError = (error) => {
  console.error('[API Client] Error:', error)

  // Errores de validación
  if (error.code === '23505') {
    return createErrorResponse(
      ERROR_CODES.VALIDATION_ERROR,
      'El registro ya existe',
      { constraint: error.detail }
    )
  }

  // Errores de permisos
  if (error.code === '42501' || error.message?.includes('permission denied')) {
    return createErrorResponse(
      ERROR_CODES.FORBIDDEN,
      'No tienes permisos para realizar esta acción'
    )
  }

  // Errores de autenticación
  if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
    return createErrorResponse(
      ERROR_CODES.UNAUTHORIZED,
      'Sesión expirada. Por favor, inicia sesión nuevamente'
    )
  }

  // Error genérico
  return createErrorResponse(
    ERROR_CODES.SERVER_ERROR,
    error.message || 'Ocurrió un error inesperado',
    { originalError: error }
  )
}

/**
 * Wrapper para llamadas a Supabase con manejo de errores estándar
 */
export const apiCall = async (supabaseQuery) => {
  try {
    const { data, error } = await supabaseQuery

    if (error) {
      return handleSupabaseError(error)
    }

    return createSuccessResponse(data)
  } catch (error) {
    // Errores de red o inesperados
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return createErrorResponse(
        ERROR_CODES.NETWORK_ERROR,
        'Error de conexión. Verifica tu internet e intenta nuevamente'
      )
    }

    return handleSupabaseError(error)
  }
}

/**
 * Agrega filtro de cliente automáticamente (multi-tenancy)
 */
export const addClienteFilter = (query, clienteId) => {
  if (!clienteId) {
    throw new Error('clienteId es requerido para filtrar por cliente')
  }
  return query.eq('cliente_id', clienteId)
}

/**
 * Agrega paginación a una query
 */
export const addPagination = (query, page = 1, limit = 20) => {
  const from = (page - 1) * limit
  const to = from + limit - 1
  return query.range(from, to)
}

/**
 * Obtiene metadata de paginación
 */
export const getPaginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1
})


