/**
 * Cliente Supabase para el backend
 * Usa service_role para operaciones privilegiadas
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno (dotenv solo funciona en desarrollo local)
// En Vercel, las variables están en process.env automáticamente
dotenv.config()

// Obtener variables de entorno (trim para eliminar espacios)
// Intentar primero SUPABASE_URL, luego VITE_SUPABASE_URL como fallback
// (en Vercel, a veces las variables VITE_ están disponibles en el runtime)
const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.trim()
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY)?.trim()

// Log de diagnóstico (siempre en Vercel, o en desarrollo, o cuando hay error)
if (process.env.VERCEL || process.env.NODE_ENV === 'development' || !supabaseUrl || !supabaseServiceKey) {
  console.log('🔍 Diagnóstico de variables de entorno:')
  console.log('  Entorno:', process.env.VERCEL ? 'Vercel' : process.env.NODE_ENV || 'production')
  console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? `✅ (${process.env.SUPABASE_URL.substring(0, 30)}...)` : '❌')
  console.log('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? `✅ (${process.env.VITE_SUPABASE_URL.substring(0, 30)}...)` : '❌')
  console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
  console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌')
  console.log('  VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌')
  console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅' : '❌')
  console.log('  Todas las variables SUPABASE:', Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', ') || 'ninguna')
  console.log('  Variables disponibles (primeras 20):', Object.keys(process.env).slice(0, 20).join(', '))
}

// Validación mejorada con mensaje más descriptivo
if (!supabaseUrl || !supabaseServiceKey) {
  const missing = []
  if (!supabaseUrl) missing.push('SUPABASE_URL o VITE_SUPABASE_URL')
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  
  const availableVars = Object.keys(process.env).filter(k => k.includes('SUPABASE'))
  const errorMsg = `Las siguientes variables de entorno no están configuradas: ${missing.join(', ')}. ` +
    `En Vercel, asegúrate de agregarlas en Settings > Environment Variables para el entorno Production. ` +
    `Variables disponibles: ${availableVars.join(', ') || 'ninguna'}`
  
  console.error('❌ Error de configuración:', errorMsg)
  throw new Error(errorMsg)
}

// Cliente con service_role (bypass RLS para operaciones admin)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Cliente con anon key (para validaciones que respetan RLS)
export const supabaseClient = createClient(
  supabaseUrl, 
  supabaseAnonKey || supabaseServiceKey
)


