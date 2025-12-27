import { useState, useEffect, useMemo } from 'react'
import { bancosService } from '../services/bancosService'
import './Admin.css'

const BANCOS_DISPONIBLES = [
  'Banco de Occidente',
  'Banco de Bogotá',
  'Bancolombia',
  'Banco Davivienda',
  'Banco Mundo mujer',
  'Banco Caja Social',
  'Banco Av Villas'
]

const TIPOS_CUENTA = ['Cuenta de ahorros', 'Cuenta corriente']

function GestionBancos({ userInfo }) {
  const [bancos, setBancos] = useState([])
  const [buscador, setBuscador] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [bancoEnEdicion, setBancoEnEdicion] = useState(null)
  const [formulario, setFormulario] = useState({
    banco_nombre: '',
    tipo_cuenta: '',
    numero_cuenta: '',
    activo: true
  })
  const [estado, setEstado] = useState({ tipo: null, mensaje: null })
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBancos()
  }, [])

  const loadBancos = async () => {
    try {
      setLoading(true)
      setEstado({ tipo: null, mensaje: null })
      
      const response = await bancosService.list({ limit: 100 })
      setBancos(response.data || [])
    } catch (error) {
      console.error('Error al cargar bancos:', error)
      let mensajeError = 'Error al cargar bancos'
      
      if (error.code === 'BACKEND_NOT_RUNNING' || error.code === 'NETWORK_ERROR') {
        mensajeError = error.message || 'El servidor backend no está disponible.'
      } else if (error.message) {
        mensajeError = error.message
      }
      
      setEstado({ tipo: 'error', mensaje: mensajeError })
      setBancos([])
    } finally {
      setLoading(false)
    }
  }

  const bancosFiltrados = useMemo(() => {
    const termino = buscador.trim().toLowerCase()
    if (!termino) return bancos
    return bancos.filter((banco) => {
      const bancoNombre = banco.banco_nombre || ''
      const numeroCuenta = banco.numero_cuenta || ''
      const tipoCuenta = banco.tipo_cuenta || ''
      return bancoNombre.toLowerCase().includes(termino) || 
             numeroCuenta.toLowerCase().includes(termino) ||
             tipoCuenta.toLowerCase().includes(termino)
    })
  }, [bancos, buscador])

  const abrirModal = (banco = null) => {
    setBancoEnEdicion(banco)
    setFormulario({
      banco_nombre: banco?.banco_nombre || '',
      tipo_cuenta: banco?.tipo_cuenta || '',
      numero_cuenta: banco?.numero_cuenta || '',
      activo: banco?.activo !== undefined ? banco.activo : true
    })
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setBancoEnEdicion(null)
    setFormulario({
      banco_nombre: '',
      tipo_cuenta: '',
      numero_cuenta: '',
      activo: true
    })
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(false)
  }

  const guardar = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setEstado({ tipo: null, mensaje: null })

    try {
      // Validar que el usuario tenga cliente_id asignado
      if (!userInfo?.clienteId) {
        setEstado({
          tipo: 'error',
          mensaje: 'Error: Tu usuario no tiene una entidad/cliente asignado. Contacta al administrador para que te asigne uno.',
        })
        setGuardando(false)
        return
      }

      const bancoData = {
        banco_nombre: formulario.banco_nombre.trim(),
        tipo_cuenta: formulario.tipo_cuenta.trim(),
        numero_cuenta: formulario.numero_cuenta.trim(),
        activo: formulario.activo
      }

      if (bancoEnEdicion) {
        await bancosService.update(bancoEnEdicion.id, bancoData)
        setEstado({ tipo: 'success', mensaje: 'Banco actualizado correctamente' })
      } else {
        await bancosService.create(bancoData)
        setEstado({ tipo: 'success', mensaje: 'Banco creado correctamente' })
      }

      await loadBancos()
      cerrarModal()
    } catch (error) {
      console.error('Error al guardar banco:', error)
      
      // Mejorar el manejo de errores
      let mensajeError = 'No fue posible guardar el banco'
      
      if (error.error) {
        // Error desde el backend
        if (error.error.code === 'FOREIGN_KEY_VIOLATION') {
          mensajeError = 'Error: El cliente asociado no es válido. Verifica tu configuración de usuario.'
        } else if (error.error.code === 'DUPLICATE_ENTRY') {
          mensajeError = 'Error: Ya existe un banco con estos datos.'
        } else if (error.error.message) {
          mensajeError = error.error.message
        }
      } else if (error.code === 'NETWORK_ERROR' || error.code === 'BACKEND_NOT_RUNNING') {
        mensajeError = error.message || 'El servidor backend no está disponible. Verifica que esté corriendo.'
      } else if (error.message) {
        mensajeError = error.message
      }
      
      setEstado({
        tipo: 'error',
        mensaje: mensajeError,
      })
    } finally {
      setGuardando(false)
    }
  }

  const getDisplayText = (banco) => {
    return `${banco.tipo_cuenta} - ${banco.numero_cuenta}`
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h2>Gestión de Bancos</h2>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Bancos</h2>
        <p>Administra las cuentas bancarias de la empresa</p>
      </div>

      <div className="clientes-admin">
        <div className="clientes-toolbar">
          <div className="clientes-search">
            <input
              type="text"
              placeholder="Buscar banco, tipo de cuenta o número..."
              value={buscador}
              onChange={(event) => setBuscador(event.target.value)}
            />
            <button className="btn-primary" onClick={() => abrirModal()}>
              <span style={{ marginRight: '6px' }}>➕</span> Nuevo Banco
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
                <th>Banco</th>
                <th>Tipo de Cuenta</th>
                <th>Número de Cuenta</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bancosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="tabla-empty">
                    No se encontraron bancos. Crea uno nuevo para empezar.
                  </td>
                </tr>
              )}
              {bancosFiltrados.map((banco) => (
                <tr key={banco.id}>
                  <td>{banco.banco_nombre}</td>
                  <td>{banco.tipo_cuenta}</td>
                  <td>{banco.numero_cuenta}</td>
                  <td>
                    <span className={`badge ${banco.activo ? 'role' : 'inactive'}`}>
                      {banco.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-link" onClick={() => abrirModal(banco)}>
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
                <h3>{bancoEnEdicion ? 'Editar banco' : 'Nuevo banco'}</h3>
                <button className="modal-close" onClick={cerrarModal} aria-label="Cerrar">
                  ×
                </button>
              </div>

              <form onSubmit={guardar} className="modal-form">
                <div className="form-group">
                  <label htmlFor="banco-nombre">Banco *</label>
                  <select
                    id="banco-nombre"
                    value={formulario.banco_nombre}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        banco_nombre: event.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Seleccione un banco...</option>
                    {BANCOS_DISPONIBLES.map((banco) => (
                      <option key={banco} value={banco}>
                        {banco}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="banco-tipo-cuenta">Tipo de Cuenta *</label>
                  <select
                    id="banco-tipo-cuenta"
                    value={formulario.tipo_cuenta}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        tipo_cuenta: event.target.value,
                      })
                    }
                    required
                  >
                    <option value="">Seleccione un tipo...</option>
                    {TIPOS_CUENTA.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="banco-numero-cuenta">Número de Cuenta *</label>
                  <input
                    id="banco-numero-cuenta"
                    type="text"
                    value={formulario.numero_cuenta}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        numero_cuenta: event.target.value,
                      })
                    }
                    placeholder="Ej: 1234567890"
                    required
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
                    />
                    {' '}Activo
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

export default GestionBancos
