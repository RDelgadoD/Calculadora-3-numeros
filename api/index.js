/**
 * Wrapper para el backend Express en Vercel Serverless Functions
 * Este archivo permite que el backend funcione como función serverless en Vercel
 */

// Cargar variables de entorno PRIMERO
import dotenv from 'dotenv'
dotenv.config()

// No importamos la app aquí, la cargaremos de forma lazy para mejor manejo de errores

// Cache para la app (se carga una vez)
let appCache = null
let appError = null

// Función para cargar la app de forma lazy
async function loadApp() {
  if (appCache) return appCache
  if (appError) throw appError
  
  try {
    // Cargar el backend usando importación dinámica
    const backendModule = await import('../backend/app.js')
    appCache = backendModule.default
    
    if (!appCache) {
      throw new Error('La aplicación Express no se exportó correctamente (default export es null/undefined)')
    }
    
    console.log('✅ Backend Express cargado correctamente')
    return appCache
  } catch (error) {
    appError = error
    console.error('❌ Error al cargar el backend:', error.message)
    console.error('Código de error:', error.code)
    console.error('Stack completo:', error.stack)
    
    // Información adicional sobre el error
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('🔍 Módulo no encontrado. Verifica:')
      console.error('   - Que el archivo ../backend/app.js existe')
      console.error('   - Que todas las dependencias están instaladas')
      console.error('   - Que las rutas de importación son correctas')
    }
    if (error.message && error.message.includes('Cannot find module')) {
      console.error('🔍 No se puede encontrar el módulo. Verifica las dependencias en package.json')
    }
    
    throw error
  }
}

// Exportar como función serverless de Vercel
// Vercel Serverless Functions esperan un handler que reciba (req, res)
export default async function handler(req, res) {
  try {
    // Cargar la app (lazy loading)
    const expressApp = await loadApp()
    
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
    return expressApp(req, res)
  } catch (error) {
    console.error('Error en el handler de Vercel:', error.message)
    console.error('Stack:', error.stack)
    
    return res.status(500).json({
      success: false,
      error: {
        code: error.code || 'SERVER_ERROR',
        message: error.message || 'Error al procesar la petición',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    })
  }
}

