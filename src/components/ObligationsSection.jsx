/**
 * Componente para gestionar obligaciones del contrato
 */

import { useState, useEffect } from 'react'
import { contractsService } from '../services/contractsService'
import { configService } from '../services/configService'
import { supabase } from '../lib/supabase'
import './ObligationsSection.css'

function ObligationsSection({ contractId, userInfo, obligations, onUpdate }) {
  const [showForm, setShowForm] = useState(false)
  const [editingObligation, setEditingObligation] = useState(null)
  const [configs, setConfigs] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [formData, setFormData] = useState({
    tipo_actividad_id: '',
    producto_id: '',
    descripcion: '',
    responsable_id: '',
    estado_obligacion_id: ''
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [tiposActividades, productos, estadosObligaciones] = await Promise.all([
        configService.getTiposActividades(),
        configService.getProductos(),
        configService.getEstadosObligaciones()
      ])

      setConfigs({
        tiposActividades: tiposActividades.data || [],
        productos: productos.data || [],
        estadosObligaciones: estadosObligaciones.data || []
      })

      // Cargar usuarios del mismo tenant
      if (userInfo?.clienteId) {
        const { data: usuariosData } = await supabase
          .from('usuarios')
          .select('id, nombre_completo, email')
          .eq('cliente_id', userInfo.clienteId)
          .eq('activo', true)
          .order('nombre_completo')

        setUsuarios(usuariosData || [])
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
    }
  }

  const handleOpenForm = (obligation = null) => {
    setEditingObligation(obligation)
    if (obligation) {
      setFormData({
        tipo_actividad_id: obligation.tipo_actividad_id || '',
        producto_id: obligation.producto_id || '',
        descripcion: obligation.descripcion || '',
        responsable_id: obligation.responsable_id || '',
        estado_obligacion_id: obligation.estado_obligacion_id || ''
      })
    } else {
      setFormData({
        tipo_actividad_id: configs?.tiposActividades[0]?.id || '',
        producto_id: configs?.productos[0]?.id || '',
        descripcion: '',
        responsable_id: '',
        estado_obligacion_id: configs?.estadosObligaciones[0]?.id || ''
      })
    }
    setShowForm(true)
    setError(null)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingObligation(null)
    setFormData({
      tipo_actividad_id: '',
      producto_id: '',
      descripcion: '',
      responsable_id: '',
      estado_obligacion_id: ''
    })
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevenir que el evento se propague al formulario padre
    setError(null)

    try {
      if (editingObligation) {
        await contractsService.updateObligation(contractId, editingObligation.id, formData)
      } else {
        await contractsService.createObligation(contractId, formData)
      }
      handleCloseForm()
      // Recargar después de cerrar el formulario pequeño para evitar que se cierre el grande
      setTimeout(() => {
        onUpdate()
      }, 100)
    } catch (err) {
      setError(err.message || 'Error al guardar la obligación')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta obligación?')) return

    try {
      await contractsService.deleteObligation(contractId, id)
      onUpdate()
    } catch (err) {
      alert(`Error al eliminar: ${err.message || 'Error desconocido'}`)
    }
  }

  if (!configs) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <div className="obligations-section" onClick={(e) => e.stopPropagation()}>
      <div className="section-header">
        <h4>Obligaciones</h4>
        <button
          type="button"
          className="btn-add"
          onClick={() => handleOpenForm()}
        >
          + Agregar
        </button>
      </div>

      {showForm && (
        <form 
          className="obligation-form" 
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
              <label htmlFor="tipo_actividad_id">Tipo de Actividad *</label>
              <select
                id="tipo_actividad_id"
                value={formData.tipo_actividad_id}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_actividad_id: e.target.value }))}
                required
              >
                <option value="">Seleccione...</option>
                {configs.tiposActividades.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="producto_id">Producto *</label>
              <select
                id="producto_id"
                value={formData.producto_id}
                onChange={(e) => setFormData(prev => ({ ...prev, producto_id: e.target.value }))}
                required
              >
                <option value="">Seleccione...</option>
                {configs.productos.map(producto => (
                  <option key={producto.id} value={producto.id}>
                    {producto.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="responsable_id">Responsable</label>
              <select
                id="responsable_id"
                value={formData.responsable_id}
                onChange={(e) => setFormData(prev => ({ ...prev, responsable_id: e.target.value }))}
              >
                <option value="">Sin asignar</option>
                {usuarios.map(usuario => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre_completo || usuario.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="estado_obligacion_id">Estado *</label>
              <select
                id="estado_obligacion_id"
                value={formData.estado_obligacion_id}
                onChange={(e) => setFormData(prev => ({ ...prev, estado_obligacion_id: e.target.value }))}
                required
              >
                <option value="">Seleccione...</option>
                {configs.estadosObligaciones.map(estado => (
                  <option key={estado.id} value={estado.id}>
                    {estado.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group form-group-full">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              rows="4"
            />
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
              {editingObligation ? 'Actualizar' : 'Guardar'}
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

      <div className="obligations-list">
        {obligations.length === 0 ? (
          <p className="empty-message">No hay obligaciones registradas</p>
        ) : (
          <table className="obligations-table">
            <thead>
              <tr>
                <th>Tipo Actividad</th>
                <th>Producto</th>
                <th>Descripción</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {obligations.map((obligation) => (
                <tr key={obligation.id}>
                  <td>{obligation.tipos_actividades?.name || '-'}</td>
                  <td>{obligation.productos?.name || '-'}</td>
                  <td className="descripcion-cell">
                    {obligation.descripcion ? (
                      obligation.descripcion.length > 50 
                        ? `${obligation.descripcion.substring(0, 50)}...` 
                        : obligation.descripcion
                    ) : '-'}
                  </td>
                  <td>{obligation.usuarios?.nombre_completo || obligation.usuarios?.email || 'Sin asignar'}</td>
                  <td>
                    <span className="estado-badge">
                      {obligation.estados_obligaciones?.name || '-'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-edit-small"
                      onClick={() => handleOpenForm(obligation)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="btn-delete-small"
                      onClick={() => handleDelete(obligation.id)}
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

export default ObligationsSection

