/**
 * Componente Spinner reutilizable
 */
export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  return (
    <div className={`spinner ${sizeClasses[size]} ${className}`}></div>
  )
}

/**
 * Spinner de página completa
 */
export function PageSpinner({ message = 'Cargando...' }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="spinner w-12 h-12 mx-auto mb-4"></div>
        <p className="text-secondary-600 dark:text-secondary-400">{message}</p>
      </div>
    </div>
  )
}


