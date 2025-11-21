import { useState } from 'react'

/**
 * Componente de tabla responsive con soporte para móvil (vista de tarjetas)
 */
export function Table({ 
  columns, 
  data, 
  onSort, 
  sortColumn, 
  sortDirection,
  loading = false,
  emptyMessage = "No se encontraron registros"
}) {
  const [mobileView, setMobileView] = useState(false)

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="spinner"></div>
          <span className="ml-3 text-secondary-600 dark:text-secondary-400">Cargando...</span>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <svg className="w-12 h-12 text-secondary-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-secondary-600 dark:text-secondary-400">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toggle vista móvil/desktop */}
      <div className="flex justify-end lg:hidden">
        <button
          onClick={() => setMobileView(!mobileView)}
          className="btn-secondary text-sm px-4 py-2"
        >
          {mobileView ? (
            <>
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Vista tabla
            </>
          ) : (
            <>
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Vista tarjetas
            </>
          )}
        </button>
      </div>

      {/* Vista de tabla (desktop y móvil cuando está activa) */}
      <div className={`table-container ${mobileView ? 'hidden lg:block' : ''}`}>
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.sortable ? 'cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/30' : ''}
                  onClick={() => column.sortable && onSort && onSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <span className="text-primary-600 dark:text-primary-400">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? '↑' : '↓'
                        ) : (
                          <span className="text-secondary-400">⇅</span>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={row.id || index}>
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas (móvil) */}
      {mobileView && (
        <div className="lg:hidden space-y-4">
          {data.map((row, index) => (
            <div key={row.id || index} className="card">
              {columns.map((column) => (
                <div key={column.key} className="mb-3 last:mb-0">
                  <div className="text-xs font-semibold text-secondary-500 dark:text-secondary-500 uppercase tracking-wide mb-1">
                    {column.label}
                  </div>
                  <div className="text-sm text-secondary-900 dark:text-secondary-100">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


