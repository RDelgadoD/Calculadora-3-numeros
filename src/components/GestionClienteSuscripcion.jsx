import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import './Admin.css'

function GestionClienteSuscripcion({ userInfo }) {
  const [clientes, setClientes] = useState([])
  const [buscador, setBuscador] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [clienteEnEdicion, setClienteEnEdicion] = useState(null)
  const [formulario, setFormulario] = useState({ nombre: '', activo: true })
  const [estado, setEstado] = useState({ tipo: null, mensaje: null })
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarClientes()
  }, [])

  const cargarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre')

      if (error) throw error
      setClientes(data || [])
    } catch (error) {
      console.error('Error al cargar clientes:', error)
      setEstado({ tipo: 'error', mensaje: 'Error al cargar clientes' })
    }
  }

  const clientesFiltrados = useMemo(() => {
    const termino = buscador.trim().toLowerCase()
    if (!termino) return clientes
    return clientes.filter((cliente) => cliente.nombre.toLowerCase().includes(termino))
  }, [clientes, buscador])

  const abrirModal = (cliente = null) => {
    setClienteEnEdicion(cliente)
    setFormulario({
      nombre: cliente?.nombre || '',
      activo: cliente?.activo ?? true,
    })
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setClienteEnEdicion(null)
    setFormulario({ nombre: '', activo: true })
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(false)
  }

  const guardar = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setEstado({ tipo: null, mensaje: null })

    try {
      const nombreNormalizado = formulario.nombre.trim()
      if (!nombreNormalizado) {
        throw new Error('El nombre del cliente es obligatorio')
      }

      if (clienteEnEdicion) {
        const { error } = await supabase
          .from('clientes')
          .update({
            nombre: nombreNormalizado,
            activo: formulario.activo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', clienteEnEdicion.id)

        if (error) throw error
        setEstado({ tipo: 'success', mensaje: 'Cliente actualizado correctamente' })
      } else {
        const { error } = await supabase.from('clientes').insert([
          {
            nombre: nombreNormalizado,
            activo: formulario.activo,
          },
        ])

        if (error) throw error
        setEstado({ tipo: 'success', mensaje: 'Cliente creado correctamente' })
      }

      await cargarClientes()
      setTimeout(() => cerrarModal(), 600)
    } catch (error) {
      console.error('Error al guardar cliente:', error)
      setEstado({
        tipo: 'error',
        mensaje: error.message || 'No fue posible guardar el cliente',
      })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Cliente de suscripción</h2>
        <p>Gestiona los clientes/tenants del sistema</p>
      </div>

      <div className="clientes-admin">
        <div className="clientes-toolbar">
          <div className="clientes-search">
            <input
              type="text"
              placeholder="Buscar cliente de suscripción..."
              value={buscador}
              onChange={(event) => setBuscador(event.target.value)}
            />
            <button className="btn-primary" onClick={() => abrirModal()}>
              <span style={{ marginRight: '6px' }}>➕</span> Nuevo Cliente
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Fecha creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={4} className="tabla-empty">
                    No se encontraron clientes. Crea uno nuevo para empezar.
                  </td>
                </tr>
              )}
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nombre}</td>
                  <td>
                    <span className={`badge ${cliente.activo ? 'active' : 'inactive'}`}>
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{new Date(cliente.created_at).toLocaleDateString('es-ES')}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-link" onClick={() => abrirModal(cliente)}>
                        <span style={{ marginRight: '4px' }}>✏️</span> Editar
                      </button>
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
                <h3>{clienteEnEdicion ? 'Editar cliente' : 'Nuevo cliente'}</h3>
                <button className="modal-close" onClick={cerrarModal} aria-label="Cerrar">
                  ×
                </button>
              </div>

              <form onSubmit={guardar} className="modal-form">
                <div className="form-group">
                  <label htmlFor="cliente-nombre">Nombre del cliente</label>
                  <input
                    id="cliente-nombre"
                    type="text"
                    value={formulario.nombre}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        nombre: event.target.value,
                      })
                    }
                    placeholder="Ej: Empresa ABC"
                    required
                  />
                </div>

                <div className="form-group form-group-inline">
                  <label htmlFor="cliente-activo">Estado</label>
                  <label className="switch">
                    <input
                      id="cliente-activo"
                      type="checkbox"
                      checked={formulario.activo}
                      onChange={(event) =>
                        setFormulario({
                          ...formulario,
                          activo: event.target.checked,
                        })
                      }
                    />
                    <span className="switch-slider" />
                    <span className="switch-label">
                      {formulario.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </label>
                </div>

                {estado.mensaje && (
                  <div className={`alert ${estado.tipo}`}>{estado.mensaje}</div>
                )}

                <div className="modal-actions">
                  <button type="submit" className="btn-primary" disabled={guardando}>
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

export default GestionClienteSuscripcion

