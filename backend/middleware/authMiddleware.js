/**
 * Middleware de autenticación
 * Verifica JWT de Supabase y extrae información del usuario/tenant
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { supabaseAdmin } from '../lib/supabase.js'

// Cargar variables de entorno si no están disponibles
if (!process.env.SUPABASE_URL) {
  dotenv.config()
}

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('SUPABASE_URL y SUPABASE_ANON_KEY deben estar configurados en el archivo .env')
}

// Cliente para verificar tokens (usa anon key)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Middleware para verificar autenticación y obtener tenant del usuario
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token de autenticación requerido'
        }
      })
    }

    const token = authHeader.split(' ')[1]

    // Verificar token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token inválido o expirado'
        }
      })
    }

    // Obtener información del usuario y tenant desde la BD
    // Usar service_role para bypass RLS (el backend tiene permisos elevados)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('id, cliente_id, rol, activo')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('[authMiddleware] Error al consultar usuarios:', {
        error: userError,
        userId: user.id,
        userEmail: user.email,
        errorCode: userError.code,
        errorMessage: userError.message,
        errorDetails: userError.details
      })
      
      // Si es un error de RLS o no encontrado, dar mensaje específico
      if (userError.code === 'PGRST116') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Usuario no encontrado en la tabla usuarios. Contacta al administrador para que te registre en el sistema.'
          }
        })
      }
      
      // Otros errores de base de datos
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Error al consultar información del usuario en la base de datos',
          details: userError.message
        }
      })
    }

    if (!userData) {
      console.error('[authMiddleware] Usuario no encontrado:', {
        userId: user.id,
        userEmail: user.email
      })
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Usuario no encontrado en la tabla usuarios. Contacta al administrador para que te registre en el sistema.'
        }
      })
    }
    
    console.log('[authMiddleware] Usuario autenticado correctamente:', {
      userId: user.id,
      email: user.email,
      clienteId: userData.cliente_id,
      rol: userData.rol
    })

    if (!userData.activo) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Usuario inactivo'
        }
      })
    }

    // Agregar información del usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      clienteId: userData.cliente_id,
      rol: userData.rol
    }

    next()
  } catch (error) {
    console.error('[authMiddleware] Error:', error)
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Error al verificar autenticación'
      }
    })
  }
}


