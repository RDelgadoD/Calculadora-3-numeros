// Vercel Serverless Function
// Ruta: /api/admin/update-user
// Método: POST
// Headers: Authorization: Bearer <JWT_TOKEN>

import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Obtener variables de entorno
    const supabaseUrl = process.env.VITE_SUPABASE_URL
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Obtener token JWT del header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' })
    }

    const token = authHeader.split(' ')[1]

    // Crear cliente para validar el token
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    })

    // Verificar que el usuario esté autenticado
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Crear cliente admin para verificar rol y ejecutar función
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar que el usuario sea admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (userError || userData?.rol !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Obtener datos del body
    const { targetUserId, newEmail, newPassword } = req.body

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' })
    }

    // Llamar a la función PostgreSQL
    const { error: updateError } = await supabaseAdmin.rpc('fn_admin_update_user', {
      target_user: targetUserId,
      new_email: newEmail || null,
      new_password: newPassword || null
    })

    if (updateError) {
      return res.status(500).json({ error: updateError.message })
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado correctamente'
    })

  } catch (error) {
    console.error('Error en update-user API:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}


