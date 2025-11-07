import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './Admin.css'

function Admin({ userInfo }) {
  const [clientes, setClientes] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('clientes')

  // Formulario de nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '' })

  // Formulario de nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    email: '',
    password: '',
    nombreCompleto: '',
    clienteId: '',
    rol: 'usuario'
  })

  useEffect(() => {
    cargarClientes()
    cargarUsuarios()
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
          )
        `)
        .order('nombre_completo')

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    }
  }

  const crearCliente = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{ nombre: nuevoCliente.nombre }])
        .select()

      if (error) throw error

      alert('✓ Cliente creado exitosamente')
      setNuevoCliente({ nombre: '' })
      cargarClientes()
    } catch (error) {
      console.error('Error al crear cliente:', error)
      alert('Error al crear cliente: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const crearUsuario = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Crear usuario en auth.users usando signUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: nuevoUsuario.email,
        password: nuevoUsuario.password,
        options: {
          data: {
            nombre_completo: nuevoUsuario.nombreCompleto,
            cliente_id: nuevoUsuario.clienteId
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario en auth')
      }

      // Crear registro en la tabla usuarios
      const { error: userError } = await supabase
        .from('usuarios')
        .insert([{
          id: authData.user.id,
          email: nuevoUsuario.email,
          nombre_completo: nuevoUsuario.nombreCompleto,
          cliente_id: nuevoUsuario.clienteId,
          rol: nuevoUsuario.rol
        }])

      if (userError) {
        // Si falla crear el registro en usuarios, intentar eliminar el usuario de auth
        console.error('Error al crear registro en usuarios:', userError)
        throw userError
      }

      alert('✓ Usuario creado exitosamente. El usuario recibirá un email de confirmación.')
      setNuevoUsuario({
        email: '',
        password: '',
        nombreCompleto: '',
        clienteId: '',
        rol: 'usuario'
      })
      cargarUsuarios()
    } catch (error) {
      console.error('Error al crear usuario:', error)
      alert('Error al crear usuario: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Administración del Sistema</h2>
        <p>Gestiona clientes y usuarios del sistema</p>
      </div>

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
        <div className="admin-section">
          <div className="admin-form">
            <h3>Crear Nuevo Cliente</h3>
            <form onSubmit={crearCliente}>
              <div className="form-group">
                <label>Nombre del Cliente:</label>
                <input
                  type="text"
                  value={nuevoCliente.nombre}
                  onChange={(e) => setNuevoCliente({ nombre: e.target.value })}
                  placeholder="Ej: Empresa ABC"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Creando...' : 'Crear Cliente'}
              </button>
            </form>
          </div>

          <div className="admin-list">
            <h3>Clientes Registrados</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(cliente => (
                  <tr key={cliente.id}>
                    <td>{cliente.nombre}</td>
                    <td>
                      <span className={`badge ${cliente.activo ? 'active' : 'inactive'}`}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>{new Date(cliente.created_at).toLocaleDateString('es-ES')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="admin-section">
          <div className="admin-form">
            <h3>Crear Nuevo Usuario</h3>
            <form onSubmit={crearUsuario}>
              <div className="form-group">
                <label>Nombre Completo:</label>
                <input
                  type="text"
                  value={nuevoUsuario.nombreCompleto}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombreCompleto: e.target.value })}
                  placeholder="Ej: Pedro Pérez"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={nuevoUsuario.email}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                  placeholder="usuario@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña:</label>
                <input
                  type="password"
                  value={nuevoUsuario.password}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
              <div className="form-group">
                <label>Cliente:</label>
                <select
                  value={nuevoUsuario.clienteId}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, clienteId: e.target.value })}
                  required
                >
                  <option value="">Seleccione un cliente</option>
                  {clientes.filter(c => c.activo).map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Rol:</label>
                <select
                  value={nuevoUsuario.rol}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
                >
                  <option value="usuario">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>

          <div className="admin-list">
            <h3>Usuarios Registrados</h3>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Cliente</th>
                  <th>Rol</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(usuario => (
                  <tr key={usuario.id}>
                    <td>{usuario.nombre_completo}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.clientes?.nombre || 'Sin cliente'}</td>
                    <td>
                      <span className="badge role">{usuario.rol}</span>
                    </td>
                    <td>
                      <span className={`badge ${usuario.activo ? 'active' : 'inactive'}`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
