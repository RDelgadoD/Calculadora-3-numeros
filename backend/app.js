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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`)
  console.log(`📝 Entorno: ${process.env.NODE_ENV || 'development'}`)
})

export default app


