/**
 * Servicio para operaciones con clientes
 */

import { supabase } from '../lib/supabase'
import { apiCall, addPagination, getPaginationMeta, createSuccessResponse } from './apiClient'

/**
 * Obtiene todos los clientes (solo admins)
 */
export const obtenerClientes = async ({ page = 1, limit = 50, activo = null } = {}) => {
  try {
    let query = supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .order('nombre')

    if (activo !== null) {
      query = query.eq('activo', activo)
    }

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
        message: error.message || 'Error al obtener clientes'
      }
    }
  }
}

/**
 * Crea un nuevo cliente
 */
export const crearCliente = async (clienteData) => {
  if (!clienteData.nombre || !clienteData.nombre.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'El nombre del cliente es obligatorio'
      }
    }
  }

  const query = supabase
    .from('clientes')
    .insert([{
      nombre: clienteData.nombre.trim(),
      activo: clienteData.activo ?? true
    }])
    .select()
    .single()

  return apiCall(query)
}

/**
 * Actualiza un cliente
 */
export const actualizarCliente = async (clienteId, clienteData) => {
  if (!clienteData.nombre || !clienteData.nombre.trim()) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'El nombre del cliente es obligatorio'
      }
    }
  }

  const query = supabase
    .from('clientes')
    .update({
      nombre: clienteData.nombre.trim(),
      activo: clienteData.activo,
      updated_at: new Date().toISOString()
    })
    .eq('id', clienteId)
    .select()
    .single()

  return apiCall(query)
}

/**
 * Obtiene un cliente por ID
 */
export const obtenerClientePorId = async (clienteId) => {
  const query = supabase
    .from('clientes')
    .select('*')
    .eq('id', clienteId)
    .single()

  return apiCall(query)
}


