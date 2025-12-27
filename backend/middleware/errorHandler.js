/**
 * Middleware global para manejo de errores
 */

export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', err)

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message || 'Error de validación',
        details: err.details || null
      }
    })
  }

  // Error de Supabase
  if (err.code && err.message) {
    // Errores de constraint (unique, foreign key, etc.)
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'El registro ya existe',
          details: err.detail || null
        }
      })
    }

    if (err.code === '23503') {
      // Extraer información del error de clave foránea
      const detail = err.detail || err.message || ''
      let mensaje = 'Referencia inválida'
      
      // Mejorar mensaje según el tipo de referencia
      if (detail.includes('cliente_id') || detail.includes('cliente')) {
        mensaje = 'El cliente/entidad asociado no existe o no es válido. Verifica la configuración del usuario.'
      } else if (detail.includes('foreign key')) {
        mensaje = `Error de referencia: ${detail}`
      }
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: mensaje,
          details: detail
        }
      })
    }

    if (err.code === '23514') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CHECK_VIOLATION',
          message: 'Violación de restricción',
          details: err.detail || null
        }
      })
    }
  }

  // Error genérico
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? err.stack : null
    }
  })
}


