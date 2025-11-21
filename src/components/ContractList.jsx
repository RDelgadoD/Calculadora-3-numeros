/**
 * Componente para listar y gestionar contratos
 * Incluye búsqueda, paginación y ordenamiento
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { contractsService } from '../services/contractsService'
import { clientsService } from '../services/clientsService'
import ContractForm from './ContractForm'
import SearchForm from './SearchForm'
import './ContractList.css'

function ContractList({ userInfo, loadingUserInfo = false }) {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingContract, setEditingContract] = useState(null)
  
  // Paginación
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 10
  
  // Filtros y ordenamiento
  const [filters, setFilters] = useState({})
  const [orderBy, setOrderBy] = useState('created_at')
  const [orderDir, setOrderDir] = useState('desc')

  // Cargar contratos
  const loadContracts = useCallback(async () => {
    // No hacer peticiones si userInfo no está listo
    if (loadingUserInfo || !userInfo?.clienteId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = {
        page,
        limit,
        orderBy,
        orderDir,
        ...filters
      }

      const response = await contractsService.list(params)
      
      setContracts(response.data || [])
      setTotalPages(response.meta?.totalPages || 1)
      setTotal(response.meta?.total || 0)
    } catch (err) {
      console.error('Error al cargar contratos:', err)
      
      // No mostrar error si es un problema de autenticación y userInfo aún se está cargando
      if (err?.code === 'UNAUTHORIZED' && loadingUserInfo) {
        return // Esperar a que userInfo se cargue
      }
      
      let errorMessage = err?.message || err?.code || 'Error al cargar los contratos'
      
      // Mensajes más específicos para errores comunes
      if (err?.code === 'BACKEND_NOT_RUNNING' || err?.code === 'NETWORK_ERROR') {
        errorMessage = err.message || 'El servidor backend no está disponible. Por favor, inicia el backend ejecutando: cd backend && npm run dev'
      }
      
      setError(errorMessage)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }, [userInfo?.clienteId, page, limit, orderBy, orderDir, filters, loadingUserInfo])

  // Memoizar filters para evitar recreaciones innecesarias y comparar por valor
  const filtersString = useMemo(() => JSON.stringify(filters), [filters])
  
  // Cargar contratos solo cuando cambien las dependencias específicas
  useEffect(() => {
    // Solo cargar contratos si userInfo está completamente cargado y tiene clienteId
    if (!loadingUserInfo && userInfo?.clienteId) {
      loadContracts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.clienteId, page, orderBy, orderDir, filtersString, loadingUserInfo])

  const handleSearch = (searchFilters) => {
    setFilters(searchFilters)
    setPage(1) // Resetear a primera página
  }

  const handleSort = (column) => {
    if (orderBy === column) {
      setOrderDir(orderDir === 'asc' ? 'desc' : 'asc')
    } else {
      setOrderBy(column)
      setOrderDir('asc')
    }
  }

  const handleCreate = () => {
    setEditingContract(null)
    setShowForm(true)
  }

  const handleEdit = (contract) => {
    setEditingContract(contract)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingContract(null)
    if (userInfo?.clienteId) {
      loadContracts() // Recargar lista
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este contrato?')) return

    try {
      await contractsService.delete(id)
      loadContracts()
    } catch (err) {
      alert(`Error al eliminar: ${err?.message || 'Error desconocido'}`)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  const formatCurrency = (value) => {
    if (!value) return '-'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(value)
  }

  // Mostrar mensaje de carga mientras se obtiene userInfo
  if (loadingUserInfo || !userInfo) {
    return (
      <div className="contract-list-container">
        <div className="loading">Cargando información del usuario...</div>
      </div>
    )
  }

  if (!userInfo?.clienteId) {
    return (
      <div className="contract-list-container">
        <div className="mensaje error">
          No se pudo identificar tu entidad. Contacta al administrador.
        </div>
      </div>
    )
  }

  return (
    <div className="contract-list-container">
      <div className="contract-list-header">
        <h2>Gestión de Contratos</h2>
        <button className="btn-create" onClick={handleCreate}>
          <span>+</span> Crear Contrato
        </button>
      </div>

      <SearchForm onSearch={handleSearch} />

      {error && !loadingUserInfo && (
        <div className="mensaje error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Cargando contratos...</div>
      ) : (
        <>
          <div className="contracts-table-wrapper">
            <table className="contracts-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('numero_contrato')}>
                    Número {orderBy === 'numero_contrato' && (orderDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('fecha_inicio')}>
                    Fecha Inicio {orderBy === 'fecha_inicio' && (orderDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Contratante</th>
                  <th onClick={() => handleSort('valor_contrato')}>
                    Valor {orderBy === 'valor_contrato' && (orderDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-message">
                      No se encontraron contratos
                    </td>
                  </tr>
                ) : (
                  contracts.map((contract) => (
                    <tr key={contract.id}>
                      <td>{contract.numero_contrato}</td>
                      <td>{formatDate(contract.fecha_inicio)}</td>
                      <td>
                        {contract.clients?.razon_social || 
                         `${contract.clients?.nombre1 || ''} ${contract.clients?.apellido1 || ''}`.trim() || 
                         '-'}
                      </td>
                      <td>{formatCurrency(contract.valor_contrato)}</td>
                      <td>{contract.tipos_contratos?.name || '-'}</td>
                      <td>
                        <span className={`estado-badge estado-${contract.estados_contratos?.name?.toLowerCase().replace(/\s+/g, '-')}`}>
                          {contract.estados_contratos?.name || '-'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEdit(contract)}
                          title="Modificar"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(contract.id)}
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-pagination"
              >
                Anterior
              </button>
              <span className="pagination-info">
                Página {page} de {totalPages} ({total} total)
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-pagination"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <ContractForm
          contract={editingContract}
          onClose={handleFormClose}
          userInfo={userInfo}
        />
      )}
    </div>
  )
}

export default ContractList
