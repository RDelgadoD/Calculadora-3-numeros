/**
 * Servicio para operaciones con cálculos
 * Encapsula toda la lógica de negocio relacionada con cálculos
 */

import { supabase } from '../lib/supabase'
import { apiCall, addClienteFilter, addPagination, getPaginationMeta, createSuccessResponse } from './apiClient'

/**
 * Crea un nuevo cálculo
 */
export const crearCalculo = async (calculosData, clienteId) => {
  if (!clienteId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'clienteId es requerido'
      }
    }
  }

  const query = supabase
    .from('calculos')
    .insert([{
      ...calculosData,
      cliente_id: clienteId
    }])
    .select()

  return apiCall(query)
}

/**
 * Obtiene cálculos con filtros y paginación
 */
export const obtenerCalculos = async ({
  clienteId,
  userId = null,
  fechaInicio = null,
  fechaFin = null,
  page = 1,
  limit = 20
}) => {
  if (!clienteId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'clienteId es requerido'
      }
    }
  }

  try {
    // Query base
    let query = supabase
      .from('calculos')
      .select('*', { count: 'exact' }) // count para obtener total
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })

    // Filtros opcionales
    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (fechaInicio) {
      query = query.gte('created_at', new Date(fechaInicio).toISOString())
    }

    if (fechaFin) {
      const fechaFinISO = new Date(fechaFin + 'T23:59:59').toISOString()
      query = query.lte('created_at', fechaFinISO)
    }

    // Aplicar paginación
    query = addPagination(query, page, limit)

    const { data, error, count } = await query

    if (error) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: error.message
        }
      }
    }

    return createSuccessResponse(data || [], {
      ...getPaginationMeta(page, limit, count || 0)
    })
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || 'Error al obtener cálculos'
      }
    }
  }
}

/**
 * Obtiene un cálculo por ID
 */
export const obtenerCalculoPorId = async (calculosId, clienteId) => {
  if (!clienteId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'clienteId es requerido'
      }
    }
  }

  const query = supabase
    .from('calculos')
    .select('*')
    .eq('id', calculosId)
    .eq('cliente_id', clienteId)
    .single()

  return apiCall(query)
}

/**
 * Elimina un cálculo
 */
export const eliminarCalculo = async (calculosId, clienteId) => {
  if (!clienteId) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'clienteId es requerido'
      }
    }
  }

  const query = supabase
    .from('calculos')
    .delete()
    .eq('id', calculosId)
    .eq('cliente_id', clienteId)

  return apiCall(query)
}


