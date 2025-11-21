import { useState, useEffect, useMemo } from 'react'
import { roleService } from '../services/roleService'
import { getMenuItemsFromDatabase, syncMenuToDatabase, MENU_STRUCTURE } from '../services/menuService'
import './GestionRoles.css'

function GestionRoles({ userInfo }) {
  const [roles, setRoles] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [buscador, setBuscador] = useState('')
  
  // Estados del modal
  const [mostrarModal, setMostrarModal] = useState(false)
  const [rolEnEdicion, setRolEnEdicion] = useState(null)
  const [formulario, setFormulario] = useState({
    name: '',
    description: '',
    activo: true
  })
  const [permisosSeleccionados, setPermisosSeleccionados] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [estado, setEstado] = useState({ tipo: null, mensaje: null })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      setEstado({ tipo: null, mensaje: null })
      
      // Sincronizar menú primero
      try {
        await syncMenuToDatabase()
      } catch (error) {
        console.warn('Error al sincronizar menú (puede ser normal si ya existe):', error)
      }

      // Cargar roles y menu items
      const [rolesRes, menuItemsRes] = await Promise.all([
        roleService.list(),
        getMenuItemsFromDatabase()
      ])

      setRoles(rolesRes.data || [])
      
      // Construir árbol de menú con submenús
      const items = menuItemsRes || []
      const menuTree = buildMenuTree(items)
      setMenuItems(menuTree)
    } catch (error) {
      console.error('Error al cargar datos:', error)
      let mensajeError = 'Error al cargar datos'
      
      if (error.code === 'BACKEND_NOT_RUNNING' || error.code === 'NETWORK_ERROR') {
        mensajeError = error.message || 'El servidor backend no está disponible. Por favor, inicia el backend ejecutando: cd backend && npm run dev'
      } else if (error.message) {
        mensajeError = error.message
      }
      
      setEstado({ tipo: 'error', mensaje: mensajeError })
      setRoles([])
      setMenuItems([])
    } finally {
      setLoading(false)
    }
  }

  // Función para construir el árbol de menú con submenús
  const buildMenuTree = (items) => {
    // Crear un mapa de items por ID (parent_id es UUID)
    const itemsMapById = new Map()
    const rootItems = []
    
    // Primero, crear todos los items en el mapa
    items.forEach(item => {
      itemsMapById.set(item.id, { ...item, children: [] })
    })
    
    // Luego, construir la jerarquía usando parent_id (UUID)
    items.forEach(item => {
      const menuItem = itemsMapById.get(item.id)
      
      if (item.parent_id) {
        // Es un submenú, buscar el padre por ID (UUID)
        const parent = itemsMapById.get(item.parent_id)
        if (parent) {
          parent.children.push(menuItem)
        } else {
          // Si no se encuentra el padre, agregarlo como root
          rootItems.push(menuItem)
        }
      } else {
        // Es un item raíz
        rootItems.push(menuItem)
      }
    })
    
    // Ordenar por orden
    const sortByOrder = (a, b) => (a.orden || 0) - (b.orden || 0)
    rootItems.sort(sortByOrder)
    rootItems.forEach(item => {
      if (item.children && item.children.length > 0) {
        item.children.sort(sortByOrder)
      }
    })
    
    return rootItems
  }

  const rolesFiltrados = useMemo(() => {
    const termino = buscador.trim().toLowerCase()
    if (!termino) return roles
    return roles.filter((rol) => 
      rol.name?.toLowerCase().includes(termino) ||
      rol.description?.toLowerCase().includes(termino)
    )
  }, [roles, buscador])

  const abrirModal = async (rol = null) => {
    setRolEnEdicion(rol)
    setFormulario({
      name: rol?.name || '',
      description: rol?.description || '',
      activo: rol?.activo ?? true
    })
    setPermisosSeleccionados([])
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(true)

    // Si es edición, cargar permisos del rol
    if (rol) {
      try {
        const response = await roleService.getById(rol.id)
        setPermisosSeleccionados(response.data.permissions || [])
      } catch (error) {
        console.error('Error al cargar permisos del rol:', error)
      }
    }
  }

  const cerrarModal = () => {
    setRolEnEdicion(null)
    setFormulario({ name: '', description: '', activo: true })
    setPermisosSeleccionados([])
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(false)
  }

  const togglePermiso = (menuItemId) => {
    setPermisosSeleccionados(prev => {
      if (prev.includes(menuItemId)) {
        return prev.filter(id => id !== menuItemId)
      } else {
        return [...prev, menuItemId]
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formulario.name.trim()) {
      setEstado({ tipo: 'error', mensaje: 'El nombre del rol es requerido' })
      return
    }

    setGuardando(true)
    setEstado({ tipo: null, mensaje: null })

    try {
      const roleData = {
        name: formulario.name.trim(),
        description: formulario.description.trim() || null,
        activo: formulario.activo,
        permissions: permisosSeleccionados
      }

      if (rolEnEdicion) {
        await roleService.update(rolEnEdicion.id, roleData)
        setEstado({ tipo: 'success', mensaje: 'Rol actualizado exitosamente' })
      } else {
        await roleService.create(roleData)
        setEstado({ tipo: 'success', mensaje: 'Rol creado exitosamente' })
      }

      // Recargar datos y cerrar modal después de un breve delay
      setTimeout(() => {
        cargarDatos()
        cerrarModal()
      }, 1000)
    } catch (error) {
      console.error('Error al guardar rol:', error)
      setEstado({
        tipo: 'error',
        mensaje: error.response?.data?.error?.message || 'Error al guardar el rol'
      })
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminar = async (rol) => {
    if (!window.confirm(`¿Estás seguro de eliminar el rol "${rol.name}"?`)) {
      return
    }

    try {
      await roleService.delete(rol.id)
      setEstado({ tipo: 'success', mensaje: 'Rol eliminado exitosamente' })
      cargarDatos()
    } catch (error) {
      console.error('Error al eliminar rol:', error)
      setEstado({
        tipo: 'error',
        mensaje: error.response?.data?.error?.message || 'Error al eliminar el rol'
      })
    }
  }

  // Función para renderizar el árbol de menú con checkboxes
  const renderMenuTree = (items, level = 0) => {
    return items.map((item) => {
      const tienePermiso = permisosSeleccionados.includes(item.id)
      const tieneHijos = item.children && item.children.length > 0

      return (
        <div key={item.id} className="menu-item-row" style={{ paddingLeft: `${level * 20}px` }}>
          <label className="menu-item-checkbox">
            <input
              type="checkbox"
              checked={tienePermiso}
              onChange={() => togglePermiso(item.id)}
            />
            <span className="checkbox-icon">
              {tienePermiso ? '✓' : '✗'}
            </span>
            <span className="menu-item-icon">{item.icon || '📋'}</span>
            <span className="menu-item-label">{item.label}</span>
          </label>
          {tieneHijos && (
            <div className="menu-item-children">
              {renderMenuTree(item.children, level + 1)}
            </div>
          )}
        </div>
      )
    })
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-state">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="gestion-roles-container">
      <div className="admin-header">
        <h2>Gestión de Roles del Sistema</h2>
        <button className="btn-primary" onClick={() => abrirModal()}>
          <span style={{ marginRight: '6px' }}>➕</span> Nuevo Rol
        </button>
      </div>

      {estado.mensaje && (
        <div className={`alert alert-${estado.tipo}`}>
          {estado.mensaje}
        </div>
      )}

      <div className="admin-search">
        <input
          type="text"
          placeholder="Buscar roles..."
          value={buscador}
          onChange={(e) => setBuscador(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rolesFiltrados.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty-state">
                  {buscador ? 'No se encontraron roles' : 'No hay roles registrados'}
                </td>
              </tr>
            ) : (
              rolesFiltrados.map((rol) => (
                <tr key={rol.id}>
                  <td><strong>{rol.name}</strong></td>
                  <td>{rol.description || '-'}</td>
                  <td>
                    <span className={`badge ${rol.activo ? 'badge-success' : 'badge-danger'}`}>
                      {rol.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-link"
                        onClick={() => abrirModal(rol)}
                        title="Editar"
                      >
                        <span style={{ marginRight: '4px' }}>✏️</span> Editar
                      </button>
                      <button
                        className="btn-link btn-danger"
                        onClick={() => handleEliminar(rol)}
                        title="Eliminar"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de creación/edición */}
      {mostrarModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={cerrarModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{rolEnEdicion ? 'Editar Rol' : 'Nuevo Rol'}</h3>
              <button 
                className="modal-close" 
                onClick={cerrarModal}
                style={{ 
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '4px 8px',
                  fontSize: '1.5rem',
                  lineHeight: '1'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Nombre del Rol *</label>
                <input
                  type="text"
                  id="name"
                  value={formulario.name}
                  onChange={(e) => setFormulario({ ...formulario, name: e.target.value })}
                  required
                  placeholder="Ej: Secretaria, Líder administrativa"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Descripción</label>
                <textarea
                  id="description"
                  value={formulario.description}
                  onChange={(e) => setFormulario({ ...formulario, description: e.target.value })}
                  rows="3"
                  placeholder="Descripción del rol y sus responsabilidades"
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formulario.activo}
                    onChange={(e) => setFormulario({ ...formulario, activo: e.target.checked })}
                  />
                  <span style={{ marginLeft: '8px' }}>Rol activo</span>
                </label>
              </div>

              <div className="form-group">
                <label>Permisos de Menú</label>
                <div className="permissions-container">
                  {menuItems.length === 0 ? (
                    <p className="empty-permissions">No hay items de menú disponibles</p>
                  ) : (
                    renderMenuTree(menuItems)
                  )}
                </div>
              </div>

              {estado.mensaje && (
                <div className={`alert alert-${estado.tipo}`} style={{ marginBottom: '16px' }}>
                  {estado.mensaje}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando...' : rolEnEdicion ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestionRoles

