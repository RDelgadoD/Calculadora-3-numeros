import { useState, useEffect, useMemo } from 'react'
import { conceptosIngresoService } from '../services/conceptosIngresoService'
import './Admin.css'

// Conceptos predefinidos según los requisitos
const CONCEPTOS_PREDEFINIDOS = [
  'Pago contrato',
  'Devolución',
  'Aporte socios',
  'Ventas en efectivo',
  'Otros'
]

function GestionConceptosIngreso({ userInfo }) {
  const [conceptos, setConceptos] = useState([])
  const [buscador, setBuscador] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [conceptoEnEdicion, setConceptoEnEdicion] = useState(null)
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    activo: true
  })
  const [estado, setEstado] = useState({ tipo: null, mensaje: null })
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConceptos()
  }, [])

  const loadConceptos = async () => {
    try {
      setLoading(true)
      setEstado({ tipo: null, mensaje: null })
      
      const response = await conceptosIngresoService.list({ limit: 100 })
      setConceptos(response.data || [])
    } catch (error) {
      console.error('Error al cargar conceptos:', error)
      // Si no hay backend, usar conceptos predefinidos
      if (error.code === 'BACKEND_NOT_RUNNING' || error.code === 'NETWORK_ERROR') {
        setConceptos(CONCEPTOS_PREDEFINIDOS.map((nombre, idx) => ({
          id: `predef-${idx}`,
          nombre,
          descripcion: '',
          activo: true,
          predefinido: true
        })))
      } else {
        let mensajeError = 'Error al cargar conceptos'
        if (error.message) {
          mensajeError = error.message
        }
        setEstado({ tipo: 'error', mensaje: mensajeError })
        setConceptos([])
      }
    } finally {
      setLoading(false)
    }
  }

  const conceptosFiltrados = useMemo(() => {
    const termino = buscador.trim().toLowerCase()
    if (!termino) return conceptos
    return conceptos.filter((concepto) => {
      const nombre = concepto.nombre || ''
      const descripcion = concepto.descripcion || ''
      return nombre.toLowerCase().includes(termino) || 
             descripcion.toLowerCase().includes(termino)
    })
  }, [conceptos, buscador])

  const abrirModal = (concepto = null) => {
    setConceptoEnEdicion(concepto)
    setFormulario({
      nombre: concepto?.nombre || '',
      descripcion: concepto?.descripcion || '',
      activo: concepto?.activo !== undefined ? concepto.activo : true
    })
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setConceptoEnEdicion(null)
    setFormulario({
      nombre: '',
      descripcion: '',
      activo: true
    })
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(false)
  }

  const guardar = async (event) => {
    event.preventDefault()
    
    // Si es predefinido, no permitir edición
    if (conceptoEnEdicion?.predefinido) {
      setEstado({ tipo: 'error', mensaje: 'Los conceptos predefinidos no se pueden editar' })
      return
    }

    setGuardando(true)
    setEstado({ tipo: null, mensaje: null })

    try {
      const conceptoData = {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim() || null,
        activo: formulario.activo
      }

      if (conceptoEnEdicion && !conceptoEnEdicion.predefinido) {
        await conceptosIngresoService.update(conceptoEnEdicion.id, conceptoData)
        setEstado({ tipo: 'success', mensaje: 'Concepto actualizado correctamente' })
      } else {
        await conceptosIngresoService.create(conceptoData)
        setEstado({ tipo: 'success', mensaje: 'Concepto creado correctamente' })
      }

      await loadConceptos()
      cerrarModal()
    } catch (error) {
      console.error('Error al guardar concepto:', error)
      setEstado({
        tipo: 'error',
        mensaje: error.error?.message || error.message || 'No fue posible guardar el concepto',
      })
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h2>Gestión de Conceptos de Ingreso</h2>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Conceptos de Ingreso</h2>
        <p>Administra los conceptos de ingreso disponibles</p>
      </div>

      <div className="clientes-admin">
        <div className="clientes-toolbar">
          <div className="clientes-search">
            <input
              type="text"
              placeholder="Buscar concepto..."
              value={buscador}
              onChange={(event) => setBuscador(event.target.value)}
            />
            <button className="btn-primary" onClick={() => abrirModal()}>
              <span style={{ marginRight: '6px' }}>➕</span> Nuevo Concepto
            </button>
          </div>
        </div>

        {estado.mensaje && estado.tipo === 'error' && (
          <div className={`alert ${estado.tipo}`}>{estado.mensaje}</div>
        )}

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Tipo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {conceptosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="tabla-empty">
                    No se encontraron conceptos. Crea uno nuevo para empezar.
                  </td>
                </tr>
              )}
              {conceptosFiltrados.map((concepto) => (
                <tr key={concepto.id}>
                  <td>{concepto.nombre}</td>
                  <td>{concepto.descripcion || '-'}</td>
                  <td>
                    <span className={`badge ${concepto.activo ? 'role' : 'inactive'}`}>
                      {concepto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    {concepto.predefinido ? (
                      <span className="badge role">Predefinido</span>
                    ) : (
                      <span className="badge">Personalizado</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions">
                      {!concepto.predefinido && (
                        <button className="btn-link" onClick={() => abrirModal(concepto)}>
                          <span style={{ marginRight: '4px' }}>✏️</span> Editar
                        </button>
                      )}
                      {concepto.predefinido && (
                        <span className="text-secondary-500 text-sm">Solo lectura</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mostrarModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" onClick={cerrarModal}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{conceptoEnEdicion ? 'Editar concepto' : 'Nuevo concepto'}</h3>
                <button className="modal-close" onClick={cerrarModal} aria-label="Cerrar">
                  ×
                </button>
              </div>

              <form onSubmit={guardar} className="modal-form">
                <div className="form-group">
                  <label htmlFor="concepto-nombre">Nombre del Concepto *</label>
                  <input
                    id="concepto-nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        nombre: event.target.value,
                      })
                    }
                    placeholder="Ej: Pago contrato, Devolución, etc."
                    required
                    disabled={conceptoEnEdicion?.predefinido}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="concepto-descripcion">Descripción</label>
                  <textarea
                    id="concepto-descripcion"
                    value={formulario.descripcion}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        descripcion: event.target.value,
                      })
                    }
                    rows={3}
                    placeholder="Descripción opcional del concepto..."
                    disabled={conceptoEnEdicion?.predefinido}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formulario.activo}
                      onChange={(event) =>
                        setFormulario({
                          ...formulario,
                          activo: event.target.checked,
                        })
                      }
                      disabled={conceptoEnEdicion?.predefinido}
                    />
                    {' '}Activo
                  </label>
                </div>

                {estado.mensaje && (
                  <div className={`alert ${estado.tipo}`}>{estado.mensaje}</div>
                )}

                <div className="modal-actions">
                  <button type="submit" className="btn-primary" disabled={guardando || conceptoEnEdicion?.predefinido}>
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={cerrarModal}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GestionConceptosIngreso
