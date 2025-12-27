/**
 * Componente para gestionar cuotas de pago
 */

import { useState } from 'react'
import { contractsService } from '../services/contractsService'
import { configService } from '../services/configService'
import './InstallmentsSection.css'

function InstallmentsSection({ contractId, valorContrato, installments, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState(null)
  const [estadosPagos, setEstadosPagos] = useState([])
  const [formData, setFormData] = useState({
    nombre_pago: '',
    valor: '',
    fecha_cobro: '',
    estado_pago_id: ''
  })
  const [error, setError] = useState(null)

  const loadEstadosPagos = async (preserveCurrentState = false) => {
    try {
      const response = await configService.getEstadosPagos()
      const estados = response.data || []
      setEstadosPagos(estados)
      
      // Buscar el estado "Registrado" por defecto
      const estadoRegistrado = estados.find(e => 
        e.name?.toLowerCase() === 'registrado' || 
        e.nombre?.toLowerCase() === 'registrado'
      )
      
      // Solo establecer estado por defecto si no se está preservando el estado actual
      // y si no hay un estado ya seleccionado
      if (!preserveCurrentState && estados.length > 0 && !formData.estado_pago_id) {
        const estadoDefault = estadoRegistrado?.id || estados[0]?.id
        if (estadoDefault) {
          setFormData(prev => ({ ...prev, estado_pago_id: estadoDefault }))
        }
      }
      
      return { estados, estadoRegistrado }
    } catch (error) {
      console.error('Error al cargar estados de pago:', error)
      return { estados: [], estadoRegistrado: null }
    }
  }

  const calcularSumaCuotas = () => {
    const suma = installments.reduce((acc, inst) => acc + parseFloat(inst.valor || 0), 0)
    return suma
  }

  const calcularSumaConNueva = (nuevoValor) => {
    const sumaActual = calcularSumaCuotas()
    const valorEditando = editingInstallment ? parseFloat(editingInstallment.valor || 0) : 0
    return sumaActual - valorEditando + parseFloat(nuevoValor || 0)
  }

  const handleOpenForm = async (installment = null) => {
    // Cargar estados primero si no están cargados
    let estados = estadosPagos
    let estadoRegistrado = null
    
    if (estados.length === 0) {
      const result = await loadEstadosPagos(!!installment) // Preservar estado si se está editando
      estados = result.estados || []
      estadoRegistrado = result.estadoRegistrado
    } else {
      // Si ya están cargados, buscar "Registrado"
      estadoRegistrado = estados.find(e => 
        e.name?.toLowerCase() === 'registrado' || 
        e.nombre?.toLowerCase() === 'registrado'
      )
    }
    
    setEditingInstallment(installment)
    if (installment) {
      // Al editar, usar el estado_pago_id del installment (que viene de la base de datos)
      // Asegurarse de usar el ID correcto, no el nombre
      const estadoId = installment.estado_pago_id || installment.estados_pagos?.id || ''
      
      // Formatear fecha para el input de tipo date (YYYY-MM-DD)
      let fechaFormateada = ''
      if (installment.fecha_cobro) {
        try {
          const fecha = new Date(installment.fecha_cobro)
          if (!isNaN(fecha.getTime())) {
            fechaFormateada = fecha.toISOString().split('T')[0]
          }
        } catch (e) {
          console.error('Error al formatear fecha:', e)
        }
      }
      
      setFormData({
        nombre_pago: installment.nombre_pago || '',
        valor: installment.valor || '',
        fecha_cobro: fechaFormateada,
        estado_pago_id: estadoId || (estados[0]?.id || '')
      })
    } else {
      // Al crear nuevo, usar "Registrado" como estado por defecto
      const estadoDefault = estadoRegistrado?.id || estados[0]?.id || ''
      setFormData({
        nombre_pago: '',
        valor: '',
        fecha_cobro: '',
        estado_pago_id: estadoDefault
      })
    }
    setShowForm(true)
    setError(null)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingInstallment(null)
    setFormData({ nombre_pago: '', valor: '', fecha_cobro: '', estado_pago_id: '' })
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevenir que el evento se propague al formulario padre
    setError(null)

    const valorNum = parseFloat(formData.valor)
    if (isNaN(valorNum) || valorNum <= 0) {
      setError('El valor debe ser un número mayor a 0')
      return
    }

    // Validar suma de cuotas
    const sumaTotal = calcularSumaConNueva(formData.valor)
    if (sumaTotal > parseFloat(valorContrato || 0)) {
      setError(`La suma de las cuotas (${sumaTotal.toFixed(2)}) excede el valor del contrato (${valorContrato})`)
      return
    }

    try {
      // Preparar datos: convertir fecha vacía a null
      const dataToSend = {
        ...formData,
        fecha_cobro: formData.fecha_cobro?.trim() || null
      }

      if (editingInstallment) {
        await contractsService.updateInstallment(contractId, editingInstallment.id, dataToSend)
      } else {
        await contractsService.createInstallment(contractId, dataToSend)
      }
      handleCloseForm()
      // Recargar después de cerrar el formulario pequeño para evitar que se cierre el grande
      setTimeout(() => {
        onUpdate()
      }, 100)
    } catch (err) {
      setError(err.message || 'Error al guardar la cuota')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta cuota?')) return

    try {
      await contractsService.deleteInstallment(contractId, id)
      onUpdate()
    } catch (err) {
      alert(`Error al eliminar: ${err.message || 'Error desconocido'}`)
    }
  }

  const sumaActual = calcularSumaCuotas()
  const porcentaje = valorContrato ? ((sumaActual / parseFloat(valorContrato)) * 100).toFixed(1) : 0

  return (
    <div className="installments-section" onClick={(e) => e.stopPropagation()}>
      <div className="section-header">
        <div>
          <h4>Cuotas de Pago</h4>
          <div className="summary-info">
            <span>Total cuotas: {sumaActual.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
            <span>Valor contrato: {parseFloat(valorContrato || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</span>
            <span className={porcentaje > 100 ? 'error' : ''}>
              {porcentaje}% utilizado
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn-add"
          onClick={() => handleOpenForm()}
          disabled={sumaActual >= parseFloat(valorContrato || 0)}
        >
          + Agregar
        </button>
      </div>

      {showForm && (
        <form 
          className="installment-form" 
          onClick={(e) => e.stopPropagation()} 
          onMouseDown={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit(e)
          }}
        >
          {error && <div className="mensaje error">{error}</div>}
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre_pago">Nombre del Pago *</label>
              <input
                id="nombre_pago"
                type="text"
                value={formData.nombre_pago}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre_pago: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="valor">Valor *</label>
              <input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fecha_cobro">Fecha de Cobro</label>
              <input
                id="fecha_cobro"
                type="date"
                value={formData.fecha_cobro}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_cobro: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="estado_pago_id">Estado *</label>
              <select
                id="estado_pago_id"
                value={formData.estado_pago_id}
                onChange={(e) => setFormData(prev => ({ ...prev, estado_pago_id: e.target.value }))}
                required
              >
                <option value="">Seleccione...</option>
                {estadosPagos.map(estado => (
                  <option key={estado.id} value={estado.id}>
                    {estado.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions-inline">
            <button 
              type="button"
              className="btn-submit-small"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleSubmit(e)
              }}
            >
              {editingInstallment ? 'Actualizar' : 'Guardar'}
            </button>
            <button 
              type="button" 
              className="btn-cancel-small" 
              onClick={(e) => {
                e.stopPropagation()
                handleCloseForm()
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="installments-list">
        {installments.length === 0 ? (
          <p className="empty-message">No hay cuotas registradas</p>
        ) : (
          <table className="installments-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Valor</th>
                <th>Fecha Cobro</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((installment) => (
                <tr key={installment.id}>
                  <td>{installment.nombre_pago}</td>
                  <td>{parseFloat(installment.valor || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}</td>
                  <td>{installment.fecha_cobro ? new Date(installment.fecha_cobro).toLocaleDateString('es-ES') : '-'}</td>
                  <td>
                    <span className="estado-badge">
                      {installment.estados_pagos?.name || '-'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-edit-small"
                      onClick={() => handleOpenForm(installment)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn-delete-small"
                      onClick={() => handleDelete(installment.id)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default InstallmentsSection

