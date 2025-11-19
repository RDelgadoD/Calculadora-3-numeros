import { useState, useRef, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useUserInfo } from '../lib/useUserInfo'
import { getMenuItemsFromDatabase, MENU_STRUCTURE } from '../services/menuService'
import Admin from './Admin'
import ContractList from './ContractList'
import ChatBubble from './ChatBubble'
import GestionClienteSuscripcion from './GestionClienteSuscripcion'
import GestionCliente from './GestionCliente'
import GestionRoles from './GestionRoles'
import CotizacionList from './CotizacionList'
import ProductosServiciosGestion from './ProductosServiciosGestion'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState(null)
  const [activeSubmenu, setActiveSubmenu] = useState(null)
  const [expandedMenu, setExpandedMenu] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [availableMenuItems, setAvailableMenuItems] = useState([])
  const menuRef = useRef(null)
  const { userInfo, loading: loadingUserInfo, permissions } = useUserInfo(user?.id)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Cargar items de menú disponibles (solo para usuarios no admin)
  useEffect(() => {
    const loadMenuItems = async () => {
      // Si es admin, no necesitamos cargar desde la BD, usamos MENU_STRUCTURE
      if (userInfo?.rol === 'admin') {
        setAvailableMenuItems(MENU_STRUCTURE)
        return
      }

      // Para usuarios no admin, usar MENU_STRUCTURE como base
      // Los permisos determinarán qué items mostrar
      setAvailableMenuItems(MENU_STRUCTURE)
    }

    if (userInfo) {
      loadMenuItems()
    }
  }, [userInfo])

  // Filtrar menú según permisos del usuario
  const visibleMenuItems = useMemo(() => {
    // Si es admin, mostrar TODOS los items del menú sin restricciones
    if (userInfo?.rol === 'admin') {
      return MENU_STRUCTURE
    }

    // Para usuarios no admin, verificar permisos
    // Si no tiene permisos cargados o no tiene roleId, no mostrar nada
    if (!userInfo?.roleId) {
      console.log('Usuario sin roleId asignado')
      return []
    }

    if (!permissions || permissions.length === 0) {
      console.log('Usuario sin permisos cargados', { permissions, roleId: userInfo.roleId })
      return []
    }

    // Normalizar permisos: pueden venir en diferentes formatos
    const normalizedPermissions = permissions.map(p => {
      // Si viene directamente con code
      if (p.code) return p
      // Si viene anidado en menu_items
      if (p.menu_items) return p.menu_items
      // Si es un objeto plano
      return p
    }).filter(p => p && p.code) // Filtrar nulos y sin code

    // Crear un mapa de códigos permitidos
    const allowedCodes = new Set(normalizedPermissions.map(p => p.code))
    
    console.log('Permisos del usuario:', {
      permissions,
      normalizedPermissions,
      allowedCodes: Array.from(allowedCodes),
      availableMenuItems: availableMenuItems.map(i => i.code)
    })

    // Filtrar items según permisos
    const filtered = availableMenuItems.filter(item => {
      // Si es adminOnly, no mostrar a no-admins
      if (item.adminOnly && userInfo.rol !== 'admin') {
        return false
      }
      // Verificar si el código está en los permisos
      const hasPermission = allowedCodes.has(item.code)
      console.log(`Item ${item.code}: ${hasPermission ? 'PERMITIDO' : 'DENEGADO'}`)
      return hasPermission
    })

    console.log('Items visibles:', filtered.map(i => i.code))
    return filtered
  }, [availableMenuItems, permissions, userInfo])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
    setMenuOpen(false)
  }

  return (
    <div className="dashboard">
      <div className="dashboard-topbar">
        <div className="topbar-left">
          <button
            className="sidebar-toggle-topbar"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h1>
            Sistema de gestión de Información
            {userInfo?.clienteNombre && ` - ${userInfo.clienteNombre}`}
          </h1>
        </div>
        <div className="topbar-right">
          <div className="user-menu-container" ref={menuRef}>
            <button 
              className="hamburger-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú de usuario"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            {menuOpen && (
              <div className="user-dropdown">
                <div className="user-info-header">
                  {userInfo && (
                    <>
                      <p className="user-name">{userInfo.nombreCompleto}</p>
                      <p className="user-email">{user.email}</p>
                      <p className="user-entidad">Entidad: {userInfo.clienteNombre}</p>
                    </>
                  )}
                  {!userInfo && <p className="user-email">{user.email}</p>}
                </div>
                <button onClick={handleLogout} className="logout-option">
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
          <nav className={`dashboard-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-section">
            {visibleMenuItems.map((item) => {
              const hasSubmenu = Array.isArray(item.children) && item.children.length > 0
              const isExpanded = expandedMenu === item.code

              const handleClickRoot = () => {
                if (hasSubmenu) {
                  const nextExpanded = isExpanded ? null : item.code
                  setExpandedMenu(nextExpanded)
                  // Si se expande, seleccionar el primer submenú por defecto
                  if (!isExpanded && item.children && item.children.length > 0) {
                    const firstChild = item.children[0]
                    setActiveView(firstChild.view_key)
                    setActiveSubmenu(firstChild.code)
                  }
                } else {
                  setActiveView(item.view_key)
                  setActiveSubmenu(null)
                  setExpandedMenu(null)
                }
              }

              return (
                <div key={item.code} className="nav-item-wrapper">
                  <button
                    className={`nav-item ${
                      activeView === item.view_key && !hasSubmenu ? 'active' : ''
                    } ${hasSubmenu ? 'has-submenu' : ''}`}
                    onClick={handleClickRoot}
                  >
                    <span className="nav-icon">{item.icon || '📋'}</span>
                    <span className="nav-text">{item.label}</span>
                    {hasSubmenu && (
                      <span className={`nav-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
                    )}
                  </button>

                  {hasSubmenu && isExpanded && (
                    <div className="nav-submenu">
                      {item.children.map((child) => (
                        <button
                          key={child.code}
                          className={`nav-submenu-item ${
                            activeSubmenu === child.code ? 'active' : ''
                          }`}
                          onClick={() => {
                            setActiveView(child.view_key)
                            setActiveSubmenu(child.code)
                          }}
                        >
                          <span className="nav-submenu-icon">{child.icon || '📋'}</span>
                          <span className="nav-submenu-text">{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            {visibleMenuItems.length === 0 && !loadingUserInfo && (
              <div className="no-permissions-message">
                <p>No tienes permisos para acceder a ninguna opción del menú.</p>
                <p>Contacta al administrador para asignarte un rol.</p>
              </div>
            )}
          </div>
        </nav>

        <div className="dashboard-content-area">
          {activeView === null && (
            <div className="empty-state">
              <h2>
                {loadingUserInfo ? (
                  'Cargando...'
                ) : userInfo ? (
                  <>
                    Bienvenido {userInfo.nombreCompleto}
                  </>
                ) : (
                  'Bienvenido'
                )}
              </h2>
              {userInfo && (
                <p className="entidad-info">
                  <strong>Entidad:</strong> {userInfo.clienteNombre}
                </p>
              )}
              <p>Selecciona una opción del menú para comenzar</p>
            </div>
          )}
          {activeView === 'contratos' && (
            <ContractList userInfo={userInfo} loadingUserInfo={loadingUserInfo} />
          )}
          {activeView === 'admin' && userInfo?.rol === 'admin' && (
            activeSubmenu === 'admin-roles' ? (
              <GestionRoles userInfo={userInfo} />
            ) : (
              <Admin userInfo={userInfo} activeSubmenu="tenant" />
            )
          )}
          {activeView === 'cotizaciones' && <CotizacionList userInfo={userInfo} />}
          {activeView === 'productos-servicios' && (
            <ProductosServiciosGestion userInfo={userInfo} />
          )}
          {activeView === 'clientes-suscripcion' && userInfo?.rol === 'admin' && <GestionClienteSuscripcion userInfo={userInfo} />}
          {activeView === 'clientes' && <GestionCliente userInfo={userInfo} />}
          {activeView === 'roles' && userInfo?.rol === 'admin' && <GestionRoles userInfo={userInfo} />}
        </div>
      </div>
      <ChatBubble userInfo={userInfo} />
    </div>
  )
}

export default Dashboard
