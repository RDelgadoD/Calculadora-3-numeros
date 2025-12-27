/**
 * Middleware de autenticación
 * Verifica JWT de Supabase y extrae información del usuario/tenant
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { supabaseAdmin } from '../lib/supabase.js'

// Cargar variables de entorno (dotenv solo funciona en desarrollo local)
// En Vercel, las variables están en process.env automáticamente
dotenv.config()

// Obtener variables de entorno (trim para eliminar espacios)
// Intentar primero SUPABASE_URL, luego VITE_SUPABASE_URL como fallback
// (en Vercel, a veces las variables VITE_ están disponibles en el runtime)
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim()
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim()

// Validación mejorada con mensaje más descriptivo
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = []
  if (!supabaseUrl) missing.push('SUPABASE_URL o VITE_SUPABASE_URL')
  if (!supabaseAnonKey) missing.push('SUPABASE_ANON_KEY o VITE_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY')
  
  const availableVars = Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  const errorMsg = `Las siguientes variables de entorno no están configuradas: ${missing.join(', ')}. ` +
    `En Vercel, asegúrate de agregarlas en Settings > Environment Variables para el entorno Production. ` +
    `Variables disponibles: ${availableVars.join(', ') || 'ninguna'}`
  
  console.error('❌ Error de configuración en authMiddleware:', errorMsg)
  throw new Error(errorMsg)
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
      console.error('[authMiddleware] Error al verificar token:', {
        authError,
        hasUser: !!user
      })
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token inválido o expirado'
        }
      })
    }

    console.log('[authMiddleware] Token verificado, usuario de Supabase Auth:', {
      id: user.id,
      email: user.email,
      id_tipo: typeof user.id
    })

    // Obtener información del usuario y tenant desde la BD
    // Usar service_role para bypass RLS (el backend tiene permisos elevados)
    // IMPORTANTE: user.id del token debe coincidir con id en tabla usuarios
    let userData = null
    let userError = null
    
    // Intentar primero por ID (método preferido)
    const { data: userDataById, error: errorById } = await supabaseAdmin
      .from('usuarios')
      .select('id, cliente_id, rol, activo')
      .eq('id', user.id)
      .single()
    
    if (errorById || !userDataById) {
      console.warn('[authMiddleware] No se encontró usuario por ID, intentando por email...')
      // Si no se encuentra por ID, intentar por email (fallback)
      const { data: userDataByEmail, error: errorByEmail } = await supabaseAdmin
        .from('usuarios')
        .select('id, cliente_id, rol, activo')
        .eq('email', user.email)
        .single()
      
      if (errorByEmail || !userDataByEmail) {
        userError = errorByEmail || errorById
        console.error('[authMiddleware] No se encontró usuario ni por ID ni por email')
      } else {
        userData = userDataByEmail
        console.log('[authMiddleware] Usuario encontrado por email (fallback)')
      }
    } else {
      userData = userDataById
    }
    
    // Log detallado para diagnóstico
    console.log('[authMiddleware] ==========================================')
    console.log('[authMiddleware] Consulta a tabla usuarios:')
    console.log('[authMiddleware]   - user.id (del token):', user.id)
    console.log('[authMiddleware]   - user.email:', user.email)
    console.log('[authMiddleware]   - Query ejecutada: usuarios WHERE id =', user.id)
    console.log('[authMiddleware]   - userError:', userError ? JSON.stringify(userError, null, 2) : 'null')
    if (userData) {
      console.log('[authMiddleware]   - userData encontrado:')
      console.log('[authMiddleware]     * id:', userData.id)
      console.log('[authMiddleware]     * cliente_id:', userData.cliente_id)
      console.log('[authMiddleware]     * cliente_id tipo:', typeof userData.cliente_id)
      console.log('[authMiddleware]     * cliente_id es null:', userData.cliente_id === null)
      console.log('[authMiddleware]     * cliente_id es undefined:', userData.cliente_id === undefined)
      console.log('[authMiddleware]     * cliente_id string vacío:', userData.cliente_id === '')
      console.log('[authMiddleware]     * rol:', userData.rol)
      console.log('[authMiddleware]     * activo:', userData.activo)
    } else {
      console.log('[authMiddleware]   - userData: null (no encontrado)')
    }
    console.log('[authMiddleware] ==========================================')

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
      rol: userData.rol,
      tieneClienteId: !!userData.cliente_id
    })
    
    // Advertencia si no tiene cliente_id
    if (!userData.cliente_id) {
      console.warn('[authMiddleware] ⚠️  ADVERTENCIA: Usuario sin cliente_id asignado:', {
        userId: user.id,
        email: user.email,
        rol: userData.rol
      })
    }

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
    // Asegurarse de que clienteId se pase correctamente (incluso si es null)
    const clienteId = userData.cliente_id || null
    
    req.user = {
      id: user.id,
      email: user.email,
      clienteId: clienteId,
      rol: userData.rol
    }
    
    // Log final para verificar qué se está pasando
    console.log('[authMiddleware] req.user configurado:', {
      id: req.user.id,
      email: req.user.email,
      clienteId: req.user.clienteId,
      clienteId_tipo: typeof req.user.clienteId,
      clienteId_null: req.user.clienteId === null,
      clienteId_undefined: req.user.clienteId === undefined,
      rol: req.user.rol
    })

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


