/**
 * Servicio para operaciones con usuarios
 */

import { supabase } from '../lib/supabase'
import { apiCall, addPagination, getPaginationMeta, createSuccessResponse } from './apiClient'

/**
 * Obtiene usuarios de un cliente con paginación
 */
export const obtenerUsuarios = async ({
  clienteId,
  activo = true,
  page = 1,
  limit = 50
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
    let query = supabase
      .from('usuarios')
      .select(`
        *,
        clientes (
          id,
          nombre
        )
      `, { count: 'exact' })
      .eq('cliente_id', clienteId)
      .order('nombre_completo')

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
        message: error.message || 'Error al obtener usuarios'
      }
    }
  }
}

/**
 * Crea un nuevo usuario
 */
export const crearUsuario = async (usuarioData) => {
  // Validaciones
  if (!usuarioData.email) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'El email es obligatorio'
      }
    }
  }

  if (!usuarioData.password || usuarioData.password.length < 6) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'La contraseña debe tener mínimo 6 caracteres'
      }
    }
  }

  if (!usuarioData.cliente_id) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'El cliente es obligatorio'
      }
    }
  }

  try {
    // 1. Crear usuario en auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: usuarioData.email,
      password: usuarioData.password,
      options: {
        data: {
          nombre_completo: usuarioData.nombre_completo,
          cliente_id: usuarioData.cliente_id
        }
      }
    })

    if (authError) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: authError.message
        }
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'No se pudo crear el usuario en auth'
        }
      }
    }

    // 2. Crear registro en tabla usuarios
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .insert([{
        id: authData.user.id,
        email: usuarioData.email,
        nombre_completo: usuarioData.nombre_completo,
        cliente_id: usuarioData.cliente_id,
        rol: usuarioData.rol || 'usuario',
        activo: usuarioData.activo ?? true
      }])
      .select()
      .single()

    if (userError) {
      return {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: userError.message
        }
      }
    }

    return createSuccessResponse(userData, {
      message: 'Usuario creado correctamente. Recibirá un email de confirmación.'
    })
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: error.message || 'Error al crear usuario'
      }
    }
  }
}

/**
 * Actualiza un usuario
 */
export const actualizarUsuario = async (userId, usuarioData) => {
  const query = supabase
    .from('usuarios')
    .update({
      ...usuarioData,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()

  return apiCall(query)
}

/**
 * Obtiene un usuario por ID
 */
export const obtenerUsuarioPorId = async (userId) => {
  const query = supabase
    .from('usuarios')
    .select(`
      *,
      clientes (
        id,
        nombre
      )
    `)
    .eq('id', userId)
    .single()

  return apiCall(query)
}


