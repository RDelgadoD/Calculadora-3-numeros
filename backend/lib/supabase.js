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
const supabaseUrl = process.env.SUPABASE_URL?.trim()
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

// Validación mejorada con mensaje más descriptivo
if (!supabaseUrl || !supabaseServiceKey) {
  const missing = []
  if (!supabaseUrl) missing.push('SUPABASE_URL')
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY')
  
  const errorMsg = `Las siguientes variables de entorno no están configuradas: ${missing.join(', ')}. ` +
    `En Vercel, asegúrate de agregarlas en Settings > Environment Variables. ` +
    `Variables disponibles: ${Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', ') || 'ninguna'}`
  
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
  process.env.SUPABASE_ANON_KEY || supabaseServiceKey
)


