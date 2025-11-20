/**
 * Backend Express.js - API para Gestión de Contratos
 * Arquitectura MVC
 */

// IMPORTANTE: Cargar variables de entorno PRIMERO, antes de cualquier import
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import contractRoutes from './routes/contractRoutes.js'
import clientRoutes from './routes/clientRoutes.js'
import configRoutes from './routes/configRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import roleRoutes from './routes/roleRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { authMiddleware } from './middleware/authMiddleware.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
// En Vercel, permitir el origen de Vercel automáticamente
const corsOrigin = process.env.CORS_ORIGIN?.trim() || ''
const allowedOrigins = corsOrigin
  ? corsOrigin.split(',').map(o => o.trim()).filter(o => o.length > 0)
  : ['http://localhost:5173']

// Si estamos en Vercel, agregar el origen de Vercel automáticamente
if (process.env.VERCEL_URL) {
  const vercelOrigin = `https://${process.env.VERCEL_URL}`
  if (!allowedOrigins.includes(vercelOrigin)) {
    allowedOrigins.push(vercelOrigin)
  }
}

// También agregar el dominio completo si está disponible
if (process.env.VERCEL && process.env.VERCEL_URL) {
  const vercelFullOrigin = `https://${process.env.VERCEL_URL}`
  if (!allowedOrigins.includes(vercelFullOrigin)) {
    allowedOrigins.push(vercelFullOrigin)
  }
}

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origen (mobile apps, curl, etc.)
    if (!origin) {
      console.log('[CORS] Request sin origen, permitiendo')
      return callback(null, true)
    }
    
    // En Vercel, permitir cualquier origen de Vercel
    if (process.env.VERCEL) {
      // Permitir cualquier subdominio de vercel.app
      if (origin.includes('.vercel.app') || origin.includes('vercel.app')) {
        console.log('[CORS] Origen de Vercel permitido:', origin)
        return callback(null, true)
      }
    }
    
    // Verificar si está en la lista de orígenes permitidos
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('[CORS] Origen permitido:', origin)
      return callback(null, true)
    }
    
    // Log para diagnóstico
    console.warn('[CORS] Origen no permitido:', origin)
    console.warn('[CORS] Orígenes permitidos:', allowedOrigins)
    console.warn('[CORS] VERCEL_URL:', process.env.VERCEL_URL)
    console.warn('[CORS] VERCEL:', process.env.VERCEL)
    
    callback(new Error('No permitido por CORS'))
  },
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Rutas API (protegidas con autenticación)
app.use('/api/contracts', authMiddleware, contractRoutes)
app.use('/api/clients', authMiddleware, clientRoutes)
app.use('/api/config', authMiddleware, configRoutes)
app.use('/api/chat', authMiddleware, chatRoutes)
app.use('/api/roles', roleRoutes)

// Manejo de errores global
app.use(errorHandler)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Ruta no encontrada'
    }
  })
})

// Iniciar servidor solo si no estamos en un entorno serverless (Vercel)
// Vercel proporciona la variable de entorno VERCEL
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`)
    console.log(`📝 Entorno: ${process.env.NODE_ENV || 'development'}`)
  })
}

export default app


