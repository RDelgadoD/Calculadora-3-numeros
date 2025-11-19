import { useState, useEffect, useMemo } from 'react'
import { clientsService } from '../services/clientsService'
import { configService } from '../services/configService'
import './Admin.css'

function GestionCliente({ userInfo }) {
  const [clients, setClients] = useState([])
  const [tiposIdentificacion, setTiposIdentificacion] = useState([])
  const [buscador, setBuscador] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [clientEnEdicion, setClientEnEdicion] = useState(null)
  const [formulario, setFormulario] = useState({
    tipo: 'natural',
    tipo_identificacion: '',
    nro_identificacion: '',
    direccion: '',
    telefono: '',
    nombre1: '',
    nombre2: '',
    apellido1: '',
    apellido2: '',
    razon_social: ''
  })
  const [estado, setEstado] = useState({ tipo: null, mensaje: null })
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [clientsData, configsData] = await Promise.all([
        clientsService.list({ limit: 100 }),
        configService.getTiposIdentificacion()
      ])

      setClients(clientsData.data || [])
      setTiposIdentificacion(configsData.data || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setEstado({ tipo: 'error', mensaje: 'Error al cargar datos' })
    } finally {
      setLoading(false)
    }
  }

  const clientsFiltrados = useMemo(() => {
    const termino = buscador.trim().toLowerCase()
    if (!termino) return clients
    return clients.filter((client) => {
      const nombre = client.razon_social || `${client.nombre1 || ''} ${client.apellido1 || ''}`.trim()
      const nroId = client.nro_identificacion || ''
      return nombre.toLowerCase().includes(termino) || nroId.toLowerCase().includes(termino)
    })
  }, [clients, buscador])

  const abrirModal = (client = null) => {
    setClientEnEdicion(client)
    setFormulario({
      tipo: client?.tipo || 'natural',
      tipo_identificacion: client?.tipo_identificacion || '',
      nro_identificacion: client?.nro_identificacion || '',
      direccion: client?.direccion || '',
      telefono: client?.telefono || '',
      nombre1: client?.nombre1 || '',
      nombre2: client?.nombre2 || '',
      apellido1: client?.apellido1 || '',
      apellido2: client?.apellido2 || '',
      razon_social: client?.razon_social || ''
    })
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setClientEnEdicion(null)
    setFormulario({
      tipo: 'natural',
      tipo_identificacion: '',
      nro_identificacion: '',
      direccion: '',
      telefono: '',
      nombre1: '',
      nombre2: '',
      apellido1: '',
      apellido2: '',
      razon_social: ''
    })
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(false)
  }

  const guardar = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setEstado({ tipo: null, mensaje: null })

    try {
      const clientData = {
        tipo: formulario.tipo,
        tipo_identificacion: formulario.tipo_identificacion,
        nro_identificacion: formulario.nro_identificacion.trim(),
        direccion: formulario.direccion.trim() || null,
        telefono: formulario.telefono.trim() || null
      }

      if (formulario.tipo === 'natural') {
        clientData.nombre1 = formulario.nombre1.trim()
        clientData.apellido1 = formulario.apellido1.trim()
        clientData.nombre2 = formulario.nombre2.trim() || null
        clientData.apellido2 = formulario.apellido2.trim() || null
      } else {
        clientData.razon_social = formulario.razon_social.trim()
      }

      if (clientEnEdicion) {
        await clientsService.update(clientEnEdicion.id, clientData)
        setEstado({ tipo: 'success', mensaje: 'Cliente actualizado correctamente' })
      } else {
        await clientsService.create(clientData)
        setEstado({ tipo: 'success', mensaje: 'Cliente creado correctamente' })
      }

      await loadInitialData()
      setTimeout(() => cerrarModal(), 600)
    } catch (error) {
      console.error('Error al guardar cliente:', error)
      setEstado({
        tipo: 'error',
        mensaje: error.error?.message || error.message || 'No fue posible guardar el cliente',
      })
    } finally {
      setGuardando(false)
    }
  }

  const getClientDisplayName = (client) => {
    if (client.tipo === 'juridica') {
      return client.razon_social || 'Sin razón social'
    }
    const nombre = `${client.nombre1 || ''} ${client.nombre2 || ''}`.trim()
    const apellido = `${client.apellido1 || ''} ${client.apellido2 || ''}`.trim()
    return `${nombre} ${apellido}`.trim() || 'Sin nombre'
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h2>Gestión de Cliente</h2>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Cliente</h2>
        <p>Gestiona los clientes/contratantes</p>
      </div>

      <div className="clientes-admin">
        <div className="clientes-toolbar">
          <div className="clientes-search">
            <input
              type="text"
              placeholder="Buscar cliente..."
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
                <th>Tipo</th>
                <th>Nombre / Razón Social</th>
                <th>Número Identificación</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientsFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="tabla-empty">
                    No se encontraron clientes. Crea uno nuevo para empezar.
                  </td>
                </tr>
              )}
              {clientsFiltrados.map((client) => (
                <tr key={client.id}>
                  <td>
                    <span className="badge role">
                      {client.tipo === 'natural' ? 'Natural' : 'Jurídica'}
                    </span>
                  </td>
                  <td>{getClientDisplayName(client)}</td>
                  <td>{client.nro_identificacion}</td>
                  <td>{client.telefono || '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-link" onClick={() => abrirModal(client)}>
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
                <h3>{clientEnEdicion ? 'Editar cliente' : 'Nuevo cliente'}</h3>
                <button className="modal-close" onClick={cerrarModal} aria-label="Cerrar">
                  ×
                </button>
              </div>

              <form onSubmit={guardar} className="modal-form">
                <div className="form-group">
                  <label htmlFor="client-tipo">Tipo de Cliente *</label>
                  <select
                    id="client-tipo"
                    value={formulario.tipo}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        tipo: event.target.value,
                      })
                    }
                    required
                  >
                    <option value="natural">Persona Natural</option>
                    <option value="juridica">Persona Jurídica</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="client-tipo-id">Tipo de Identificación *</label>
                  <select
                    id="client-tipo-id"
                    value={formulario.tipo_identificacion}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        tipo_identificacion: event.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Seleccione...</option>
                    {tiposIdentificacion.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="client-nro-id">Número de Identificación *</label>
                  <input
                    id="client-nro-id"
                    type="text"
                    value={formulario.nro_identificacion}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        nro_identificacion: event.target.value,
                      })
                    }
                    placeholder="Ej: 1234567890"
                    required
                  />
                </div>

                {formulario.tipo === 'natural' ? (
                  <>
                    <div className="form-group">
                      <label htmlFor="client-nombre1">Primer Nombre *</label>
                      <input
                        id="client-nombre1"
                        type="text"
                        value={formulario.nombre1}
                        onChange={(event) =>
                          setFormulario({
                            ...formulario,
                            nombre1: event.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="client-nombre2">Segundo Nombre</label>
                      <input
                        id="client-nombre2"
                        type="text"
                        value={formulario.nombre2}
                        onChange={(event) =>
                          setFormulario({
                            ...formulario,
                            nombre2: event.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="client-apellido1">Primer Apellido *</label>
                      <input
                        id="client-apellido1"
                        type="text"
                        value={formulario.apellido1}
                        onChange={(event) =>
                          setFormulario({
                            ...formulario,
                            apellido1: event.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="client-apellido2">Segundo Apellido</label>
                      <input
                        id="client-apellido2"
                        type="text"
                        value={formulario.apellido2}
                        onChange={(event) =>
                          setFormulario({
                            ...formulario,
                            apellido2: event.target.value,
                          })
                        }
                      />
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label htmlFor="client-razon-social">Razón Social *</label>
                    <input
                      id="client-razon-social"
                      type="text"
                      value={formulario.razon_social}
                      onChange={(event) =>
                        setFormulario({
                          ...formulario,
                          razon_social: event.target.value,
                        })
                      }
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="client-direccion">Dirección</label>
                  <textarea
                    id="client-direccion"
                    value={formulario.direccion}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        direccion: event.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="client-telefono">Teléfono</label>
                  <input
                    id="client-telefono"
                    type="text"
                    value={formulario.telefono}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        telefono: event.target.value,
                      })
                    }
                  />
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

export default GestionCliente

