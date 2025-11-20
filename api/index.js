/**
 * Wrapper para el backend Express en Vercel Serverless Functions
 * Este archivo permite que el backend funcione como función serverless en Vercel
 */

// Cargar variables de entorno PRIMERO
import dotenv from 'dotenv'
dotenv.config()

// Importar la app de Express del backend
import app from '../backend/app.js'

// Exportar como función serverless de Vercel
// Vercel Serverless Functions esperan un handler que reciba (req, res)
export default function handler(req, res) {
  try {
    // En Vercel, cuando una petición llega a /api/contracts, la función recibe
    // req.url como '/contracts' (sin el prefijo /api)
    // Necesitamos agregar el prefijo /api para que Express lo maneje correctamente
    const originalUrl = req.url || '/'
    
    // Si la URL no comienza con /api, la agregamos
    // Ejemplo: '/contracts' -> '/api/contracts'
    if (!originalUrl.startsWith('/api')) {
      req.url = `/api${originalUrl}`
      // También actualizamos originalUrl si Express lo usa internamente
      if (req.originalUrl && !req.originalUrl.startsWith('/api')) {
        req.originalUrl = `/api${req.originalUrl}`
      }
    }
    
    // Pasar la petición directamente a Express
    return app(req, res)
  } catch (error) {
    console.error('Error en el handler de Vercel:', error)
    console.error('Stack:', error.stack)
    return res.status(500).json({
      success: false,
      error: {
        code: 'HANDLER_ERROR',
        message: error.message || 'Error al procesar la petición'
      }
    })
  }
}

