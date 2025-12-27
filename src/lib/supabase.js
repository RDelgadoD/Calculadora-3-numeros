import { createClient } from '@supabase/supabase-js'

// Obtén estas credenciales de tu proyecto Supabase
// Ve a: https://app.supabase.com -> Tu proyecto -> Settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Logs de diagnóstico (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔍 Diagnóstico Supabase:')
  console.log('  VITE_SUPABASE_URL:', supabaseUrl ? `✅ Presente (${supabaseUrl.substring(0, 30)}...)` : '❌ Ausente')
  console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `✅ Presente (${supabaseAnonKey.substring(0, 20)}...)` : '❌ Ausente')
  console.log('  Todos los import.meta.env:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')).join(', '))
}

// Validación antes de crear el cliente
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERROR: Faltan variables de entorno de Supabase')
  console.error('  Asegúrate de tener un archivo .env en la raíz del proyecto con:')
  console.error('  VITE_SUPABASE_URL=tu_url')
  console.error('  VITE_SUPABASE_ANON_KEY=tu_clave')
  console.error('  Después, REINICIA el servidor de desarrollo (Ctrl+C y luego npm run dev)')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
