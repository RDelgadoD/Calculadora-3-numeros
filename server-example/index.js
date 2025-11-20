// Ejemplo de servidor Express.js con autenticación JWT de Supabase
// Instalar: npm install express @supabase/supabase-js cors dotenv

import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Cliente Supabase con service_role (solo para backend)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Middleware para verificar JWT de Supabase
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    
    // Verificar el token con Supabase
    const { data: { user }, error } = await supabaseClient.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Verificar que el usuario sea admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('rol, cliente_id')
      .eq('id', user.id)
      .single()

    if (userError || userData?.rol !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Agregar información del usuario al request
    req.user = user
    req.userInfo = userData
    
    next()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Ruta protegida: Actualizar usuario
app.post('/api/admin/update-user', verifyAuth, async (req, res) => {
  try {
    const { targetUserId, newEmail, newPassword } = req.body

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' })
    }

    // Llamar a la función PostgreSQL
    const { error } = await supabaseAdmin.rpc('fn_admin_update_user', {
      target_user: targetUserId,
      new_email: newEmail || null,
      new_password: newPassword || null
    })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    res.json({ success: true, message: 'Usuario actualizado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})


