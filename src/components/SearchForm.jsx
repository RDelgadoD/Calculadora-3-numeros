/**
 * Componente de búsqueda avanzada para contratos
 * Incluye debounce y filtros múltiples
 */

import { useState, useEffect, useRef } from 'react'
import { clientsService } from '../services/clientsService'
import './SearchForm.css'

function SearchForm({ onSearch }) {
  const [numeroContrato, setNumeroContrato] = useState('')
  const [fechaInicioDesde, setFechaInicioDesde] = useState('')
  const [fechaInicioHasta, setFechaInicioHasta] = useState('')
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState([])
  const [loadingClients, setLoadingClients] = useState(false)
  const debounceTimer = useRef(null)

  // Cargar clientes para el select
  useEffect(() => {
    // Pequeño delay para asegurar que la sesión esté lista
    const timer = setTimeout(() => {
      loadClients()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  const loadClients = async () => {
    setLoadingClients(true)
    try {
      const response = await clientsService.list({ limit: 100 })
      setClients(response.data || [])
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      // No mostrar error al usuario, solo dejar el select vacío
      setClients([])
    } finally {
      setLoadingClients(false)
    }
  }

  // Debounce para búsqueda automática
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      const filters = {}
      
      if (numeroContrato.trim()) {
        filters.numero_contrato = numeroContrato.trim()
      }
      
      if (fechaInicioDesde) {
        filters.fecha_inicio_desde = fechaInicioDesde
      }
      
      if (fechaInicioHasta) {
        filters.fecha_inicio_hasta = fechaInicioHasta
      }
      
      if (clientId) {
        filters.client_id = clientId
      }

      onSearch(filters)
    }, 500) // 500ms de debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [numeroContrato, fechaInicioDesde, fechaInicioHasta, clientId, onSearch])

  const handleClear = () => {
    setNumeroContrato('')
    setFechaInicioDesde('')
    setFechaInicioHasta('')
    setClientId('')
    onSearch({})
  }

  const getClientName = (client) => {
    if (client.tipo === 'juridica') {
      return client.razon_social || '-'
    }
    return `${client.nombre1 || ''} ${client.apellido1 || ''}`.trim() || '-'
  }

  return (
    <div className="search-form-container">
      <h3>Búsqueda Avanzada</h3>
      <div className="search-form-grid">
        <div className="form-group">
          <label htmlFor="numero-contrato">Número de Contrato</label>
          <input
            id="numero-contrato"
            type="text"
            value={numeroContrato}
            onChange={(e) => setNumeroContrato(e.target.value)}
            placeholder="Buscar por número..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="fecha-desde">Fecha Inicio Desde</label>
          <input
            id="fecha-desde"
            type="date"
            value={fechaInicioDesde}
            onChange={(e) => setFechaInicioDesde(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="fecha-hasta">Fecha Inicio Hasta</label>
          <input
            id="fecha-hasta"
            type="date"
            value={fechaInicioHasta}
            onChange={(e) => setFechaInicioHasta(e.target.value)}
            min={fechaInicioDesde || undefined}
          />
        </div>

        <div className="form-group">
          <label htmlFor="cliente">Contratante</label>
          <select
            id="cliente"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={loadingClients}
          >
            <option value="">Todos</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {getClientName(client)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group form-group-actions">
          <button className="btn-clear" onClick={handleClear}>
            Limpiar
          </button>
        </div>
      </div>
    </div>
  )
}

export default SearchForm

