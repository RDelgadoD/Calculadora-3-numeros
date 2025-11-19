import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { roleService } from '../services/roleService'
import './Admin.css'

function GestionTenant({ userInfo }) {
  const [clientes, setClientes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [activeTab, setActiveTab] = useState('clientes')

  const [clienteBuscador, setClienteBuscador] = useState('')
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false)
  const [clienteEnEdicion, setClienteEnEdicion] = useState(null)
  const [formularioCliente, setFormularioCliente] = useState({ nombre: '', activo: true })
  const [estadoCliente, setEstadoCliente] = useState({ tipo: null, mensaje: null })
  const [guardandoCliente, setGuardandoCliente] = useState(false)

  const [usuarioBuscador, setUsuarioBuscador] = useState('')
  const [mostrarModalUsuario, setMostrarModalUsuario] = useState(false)
  const [usuarioEnEdicion, setUsuarioEnEdicion] = useState(null)
  const [formularioUsuario, setFormularioUsuario] = useState({
    nombreCompleto: '',
    email: '',
    password: '',
    clienteId: '',
    rol: 'usuario',
    roleId: '',
    activo: true,
  })
  const [estadoUsuario, setEstadoUsuario] = useState({ tipo: null, mensaje: null })
  const [guardandoUsuario, setGuardandoUsuario] = useState(false)

  useEffect(() => {
    cargarClientes()
    cargarUsuarios()
    cargarRoles()
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
    }
  }

  const cargarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          clientes (
            id,
            nombre
          ),
          roles (
            id,
            name
          )
        `)
        .order('nombre_completo')

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    }
  }

  const cargarRoles = async () => {
    try {
      const response = await roleService.list()
      setRoles(response.data || [])
    } catch (error) {
      console.error('Error al cargar roles:', error)
    }
  }

  const clientesFiltrados = useMemo(() => {
    const termino = clienteBuscador.trim().toLowerCase()
    if (!termino) return clientes
    return clientes.filter((cliente) => cliente.nombre.toLowerCase().includes(termino))
  }, [clientes, clienteBuscador])

  const usuariosFiltrados = useMemo(() => {
    const termino = usuarioBuscador.trim().toLowerCase()
    if (!termino) return usuarios
    return usuarios.filter((usuario) => {
      const nombre = usuario.nombre_completo?.toLowerCase() || ''
      const email = usuario.email?.toLowerCase() || ''
      const clienteNombre = usuario.clientes?.nombre?.toLowerCase() || ''
      return (
        nombre.includes(termino) || email.includes(termino) || clienteNombre.includes(termino)
      )
    })
  }, [usuarios, usuarioBuscador])

  const abrirModalCliente = (cliente = null) => {
    setClienteEnEdicion(cliente)
    setFormularioCliente({
      nombre: cliente?.nombre || '',
      activo: cliente?.activo ?? true,
    })
    setEstadoCliente({ tipo: null, mensaje: null })
    setMostrarModalCliente(true)
  }

  const cerrarModalCliente = () => {
    setClienteEnEdicion(null)
    setFormularioCliente({ nombre: '', activo: true })
    setEstadoCliente({ tipo: null, mensaje: null })
    setMostrarModalCliente(false)
  }

  const guardarCliente = async (event) => {
    event.preventDefault()
    setGuardandoCliente(true)
    setEstadoCliente({ tipo: null, mensaje: null })

    try {
      const nombreNormalizado = formularioCliente.nombre.trim()
      if (!nombreNormalizado) {
        throw new Error('El nombre del cliente es obligatorio')
      }

      if (clienteEnEdicion) {
        const { error } = await supabase
          .from('clientes')
          .update({
            nombre: nombreNormalizado,
            activo: formularioCliente.activo,
            updated_at: new Date().toISOString(),
          })
          .eq('id', clienteEnEdicion.id)

        if (error) throw error
        setEstadoCliente({ tipo: 'success', mensaje: 'Cliente actualizado correctamente' })
      } else {
        const { error } = await supabase
          .from('clientes')
          .insert([
            {
              nombre: nombreNormalizado,
              activo: formularioCliente.activo,
            },
          ])

        if (error) throw error
        setEstadoCliente({ tipo: 'success', mensaje: 'Cliente creado correctamente' })
      }

      await cargarClientes()
      setTimeout(() => cerrarModalCliente(), 600)
    } catch (error) {
      console.error('Error al guardar cliente:', error)
      setEstadoCliente({
        tipo: 'error',
        mensaje: error.message || 'No fue posible guardar el cliente',
      })
    } finally {
      setGuardandoCliente(false)
    }
  }

  const abrirModalUsuario = async (usuario = null) => {
    await cargarRoles()
    
    setUsuarioEnEdicion(usuario)
    setFormularioUsuario({
      nombreCompleto: usuario?.nombre_completo || '',
      email: usuario?.email || '',
      password: '',
      clienteId: usuario?.cliente_id || '',
      rol: usuario?.rol || 'usuario',
      roleId: usuario?.role_id || '',
      activo: usuario?.activo ?? true,
    })
    setEstadoUsuario({ tipo: null, mensaje: null })
    setMostrarModalUsuario(true)
  }

  const cerrarModalUsuario = () => {
    setUsuarioEnEdicion(null)
    setFormularioUsuario({
      nombreCompleto: '',
      email: '',
      password: '',
      clienteId: '',
      rol: 'usuario',
      roleId: '',
      activo: true,
    })
    setEstadoUsuario({ tipo: null, mensaje: null })
    setMostrarModalUsuario(false)
  }

  const guardarUsuario = async (event) => {
    event.preventDefault()
    setGuardandoUsuario(true)
    setEstadoUsuario({ tipo: null, mensaje: null })

    try {
      const nombreNormalizado = formularioUsuario.nombreCompleto.trim()
      if (!nombreNormalizado) {
        throw new Error('El nombre completo es obligatorio')
      }

      if (usuarioEnEdicion) {
        const { error } = await supabase.rpc('fn_admin_update_user', {
          target_user: usuarioEnEdicion.id,
          new_email: formularioUsuario.email.trim(),
          new_password:
            formularioUsuario.password && formularioUsuario.password.length >= 6
              ? formularioUsuario.password
              : null,
        })

        if (error) throw error

        const { error: updateUserError } = await supabase
          .from('usuarios')
          .update({
            nombre_completo: nombreNormalizado,
            cliente_id: formularioUsuario.clienteId,
            rol: formularioUsuario.rol,
            role_id: formularioUsuario.roleId || null,
            activo: formularioUsuario.activo,
            email: formularioUsuario.email.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', usuarioEnEdicion.id)

        if (updateUserError) throw updateUserError
        setEstadoUsuario({ tipo: 'success', mensaje: 'Usuario actualizado correctamente' })
      } else {
        const emailNormalizado = formularioUsuario.email.trim()
        if (!emailNormalizado) {
          throw new Error('El email es obligatorio')
        }
        if ((formularioUsuario.password || '').length < 6) {
          throw new Error('La contraseña debe tener mínimo 6 caracteres')
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailNormalizado,
          password: formularioUsuario.password,
          options: {
            data: {
              nombre_completo: nombreNormalizado,
              cliente_id: formularioUsuario.clienteId,
            },
          },
        })

        if (authError) throw authError
        if (!authData.user) {
          throw new Error('No se pudo crear el usuario en auth')
        }

        const { error: userError } = await supabase.from('usuarios').insert([
          {
            id: authData.user.id,
            email: emailNormalizado,
            nombre_completo: nombreNormalizado,
            cliente_id: formularioUsuario.clienteId,
            rol: formularioUsuario.rol,
            role_id: formularioUsuario.roleId || null,
            activo: formularioUsuario.activo,
          },
        ])

        if (userError) throw userError
        setEstadoUsuario({
          tipo: 'success',
          mensaje: 'Usuario creado correctamente. Recibirá un email de confirmación.',
        })
      }

      await cargarUsuarios()
      setTimeout(() => cerrarModalUsuario(), 600)
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      setEstadoUsuario({
        tipo: 'error',
        mensaje: error.message || 'No fue posible guardar el usuario',
      })
    } finally {
      setGuardandoUsuario(false)
    }
  }

  return (
    <div className="gestion-tenant-container">
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'clientes' ? 'active' : ''}`}
          onClick={() => setActiveTab('clientes')}
        >
          Clientes
        </button>
        <button
          className={`admin-tab ${activeTab === 'usuarios' ? 'active' : ''}`}
          onClick={() => setActiveTab('usuarios')}
        >
          Usuarios
        </button>
      </div>

      {activeTab === 'clientes' && (
        <div className="clientes-admin">
          <div className="clientes-toolbar">
            <div className="clientes-search">
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={clienteBuscador}
                onChange={(event) => setClienteBuscador(event.target.value)}
              />
              <button className="btn-primary" onClick={() => abrirModalCliente()}>
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
                        <button className="btn-link" onClick={() => abrirModalCliente(cliente)}>
                          <span style={{ marginRight: '4px' }}>✏️</span> Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mostrarModalCliente && (
            <div className="modal-overlay" role="dialog" aria-modal="true" onClick={cerrarModalCliente}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{clienteEnEdicion ? 'Editar cliente' : 'Nuevo cliente'}</h3>
                  <button className="modal-close" onClick={cerrarModalCliente} aria-label="Cerrar">
                    ×
                  </button>
                </div>

                <form onSubmit={guardarCliente} className="modal-form">
                  <div className="form-group">
                    <label htmlFor="cliente-nombre">Nombre del cliente</label>
                    <input
                      id="cliente-nombre"
                      type="text"
                      value={formularioCliente.nombre}
                      onChange={(event) =>
                        setFormularioCliente({
                          ...formularioCliente,
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
                        checked={formularioCliente.activo}
                        onChange={(event) =>
                          setFormularioCliente({
                            ...formularioCliente,
                            activo: event.target.checked,
                          })
                        }
                      />
                      <span className="switch-slider" />
                      <span className="switch-label">
                        {formularioCliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </label>
                  </div>

                  {estadoCliente.mensaje && (
                    <div className={`alert ${estadoCliente.tipo}`}>{estadoCliente.mensaje}</div>
                  )}

                  <div className="modal-actions">
                    <button type="submit" className="btn-primary" disabled={guardandoCliente}>
                      {guardandoCliente ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={cerrarModalCliente}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="clientes-admin usuarios-admin">
          <div className="clientes-toolbar">
            <div className="clientes-search">
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={usuarioBuscador}
                onChange={(event) => setUsuarioBuscador(event.target.value)}
              />
              <button className="btn-primary" onClick={() => abrirModalUsuario()}>
                <span style={{ marginRight: '6px' }}>➕</span> Nuevo Usuario
              </button>
            </div>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Cliente</th>
                  <th>Rol Sistema</th>
                  <th>Rol Permisos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={7} className="tabla-empty">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                )}
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.nombre_completo}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.clientes?.nombre || 'Sin cliente'}</td>
                    <td>
                      <span className="badge role">{usuario.rol}</span>
                    </td>
                    <td>
                      {usuario.rol === 'admin' ? (
                        <span className="badge" style={{ background: '#2d8659', color: 'white' }}>
                          Acceso completo
                        </span>
                      ) : usuario.roles?.name ? (
                        <span className="badge" style={{ background: '#4a90e2', color: 'white' }}>
                          {usuario.roles.name}
                        </span>
                      ) : (
                        <span className="badge" style={{ background: '#999', color: 'white' }}>
                          Sin rol asignado
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${usuario.activo ? 'active' : 'inactive'}`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-link" onClick={() => abrirModalUsuario(usuario)}>
                          <span style={{ marginRight: '4px' }}>✏️</span> Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mostrarModalUsuario && (
            <div className="modal-overlay" role="dialog" aria-modal="true" onClick={cerrarModalUsuario}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{usuarioEnEdicion ? 'Editar usuario' : 'Nuevo usuario'}</h3>
                  <button className="modal-close" onClick={cerrarModalUsuario} aria-label="Cerrar">
                    ×
                  </button>
                </div>

                <form onSubmit={guardarUsuario} className="modal-form">
                  <div className="form-group">
                    <label htmlFor="usuario-nombre">Nombre completo</label>
                    <input
                      id="usuario-nombre"
                      type="text"
                      value={formularioUsuario.nombreCompleto}
                      onChange={(event) =>
                        setFormularioUsuario({
                          ...formularioUsuario,
                          nombreCompleto: event.target.value,
                        })
                      }
                      placeholder="Ej: Pedro Pérez"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="usuario-email">Email</label>
                    <input
                      id="usuario-email"
                      type="email"
                      value={formularioUsuario.email}
                      onChange={(event) =>
                        setFormularioUsuario({
                          ...formularioUsuario,
                          email: event.target.value,
                        })
                      }
                      placeholder="usuario@email.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="usuario-password">
                      Contraseña {usuarioEnEdicion ? '(deja vacío para mantenerla)' : ''}
                    </label>
                    <input
                      id="usuario-password"
                      type="password"
                      value={formularioUsuario.password}
                      onChange={(event) =>
                        setFormularioUsuario({
                          ...formularioUsuario,
                          password: event.target.value,
                        })
                      }
                      placeholder={usuarioEnEdicion ? 'Opcional' : 'Mínimo 6 caracteres'}
                      minLength={usuarioEnEdicion ? undefined : 6}
                      required={!usuarioEnEdicion}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="usuario-cliente">Cliente</label>
                    <select
                      id="usuario-cliente"
                      value={formularioUsuario.clienteId}
                      onChange={(event) =>
                        setFormularioUsuario({
                          ...formularioUsuario,
                          clienteId: event.target.value,
                        })
                      }
                      required
                    >
                      <option value="">Seleccione un cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id} disabled={!cliente.activo}>
                          {cliente.nombre}
                          {!cliente.activo ? ' (inactivo)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="usuario-rol">Rol de Sistema</label>
                    <select
                      id="usuario-rol"
                      value={formularioUsuario.rol}
                      onChange={(event) =>
                        setFormularioUsuario({ ...formularioUsuario, rol: event.target.value })
                      }
                    >
                      <option value="usuario">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                      Los administradores tienen acceso completo. Los usuarios requieren un rol del sistema asignado.
                    </small>
                  </div>

                  {formularioUsuario.rol !== 'admin' && (
                    <div className="form-group">
                      <label htmlFor="usuario-role-id">Rol del Sistema (Permisos)</label>
                      <select
                        id="usuario-role-id"
                        value={formularioUsuario.roleId}
                        onChange={(event) =>
                          setFormularioUsuario({ ...formularioUsuario, roleId: event.target.value })
                        }
                      >
                        <option value="">Seleccione un rol (opcional)</option>
                        {roles
                          .filter(role => role.activo)
                          .map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name} {role.description ? `- ${role.description}` : ''}
                            </option>
                          ))}
                      </select>
                      <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                        Asigna un rol del sistema para definir los permisos de acceso al menú. Si no se asigna, el usuario no tendrá acceso a ninguna opción.
                      </small>
                    </div>
                  )}

                  <div className="form-group form-group-inline">
                    <label htmlFor="usuario-activo">Estado</label>
                    <label className="switch">
                      <input
                        id="usuario-activo"
                        type="checkbox"
                        checked={formularioUsuario.activo}
                        onChange={(event) =>
                          setFormularioUsuario({
                            ...formularioUsuario,
                            activo: event.target.checked,
                          })
                        }
                      />
                      <span className="switch-slider" />
                      <span className="switch-label">
                        {formularioUsuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </label>
                  </div>

                  {estadoUsuario.mensaje && (
                    <div className={`alert ${estadoUsuario.tipo}`}>{estadoUsuario.mensaje}</div>
                  )}

                  <div className="modal-actions">
                    <button type="submit" className="btn-primary" disabled={guardandoUsuario}>
                      {guardandoUsuario ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={cerrarModalUsuario}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default GestionTenant

