import { useState } from 'react'

/**
 * Componente Tooltip simple
 */
export function Tooltip({ children, content, position = 'top' }) {
  const [show, setShow] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`
          absolute z-50 px-3 py-2 text-xs font-medium text-white bg-secondary-900 dark:bg-secondary-700 
          rounded-lg shadow-medium whitespace-nowrap pointer-events-none animate-fade-in
          ${positionClasses[position]}
        `}>
          {content}
          {/* Flecha del tooltip */}
          <div className={`
            absolute w-2 h-2 bg-secondary-900 dark:bg-secondary-700 transform rotate-45
            ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
            ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2' : ''}
            ${position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -translate-x-1/2' : ''}
            ${position === 'right' ? 'right-full top-1/2 -translate-y-1/2 translate-x-1/2' : ''}
          `}></div>
        </div>
      )}
    </div>
  )
}


