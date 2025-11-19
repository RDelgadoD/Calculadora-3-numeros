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
      return res.status(400).json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Referencia inválida',
          details: err.detail || null
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


