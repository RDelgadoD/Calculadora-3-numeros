import { useState, useRef, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useUserInfo } from '../lib/useUserInfo'
import { MENU_STRUCTURE } from '../services/menuService'
import Admin from './Admin'
import ContractList from './ContractList'
import ChatBubble from './ChatBubble'
import GestionClienteSuscripcion from './GestionClienteSuscripcion'
import GestionCliente from './GestionCliente'
import GestionRoles from './GestionRoles'
import CotizacionList from './CotizacionList'
import ProductosServiciosGestion from './ProductosServiciosGestion'
import GestionBancos from './GestionBancos'
import GestionConceptosIngreso from './GestionConceptosIngreso'
import GestionIngresos from './GestionIngresos'

// Iconos SVG como componentes
const MenuIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const ChevronDownIcon = ({ className = "w-3 h-3" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
  </svg>
)

const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const LogoutIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

// Mapeo de iconos del menú a SVG
const getMenuIcon = (icon) => {
  // Si es un emoji, devolverlo tal cual
  if (icon && icon.length <= 2) return icon
  
  // Mapeo de iconos comunes
  const iconMap = {
    '📋': 'DocumentTextIcon',
    '⚙️': 'CogIcon',
    '💼': 'BriefcaseIcon',
    '👥': 'UsersIcon',
    '🏢': 'BuildingOfficeIcon',
    '🧾': 'DocumentIcon',
    '📦': 'CubeIcon',
  }
  
  return icon || '📋'
}

function Dashboard({ user, onLogout }) {
  // Logs visibles que no se pueden filtrar
  console.error('========================================')
  console.error('🚀 DASHBOARD INICIADO')
  console.error('========================================')
  console.error('🚀 Dashboard component rendered - user:', user?.id)
  console.error('🚀 MENU_STRUCTURE length:', MENU_STRUCTURE?.length)
  const gestionFinanciera = MENU_STRUCTURE.find(m => m.code === 'gestion-financiera')
  console.error('🚀 Gestión Financiera encontrada:', gestionFinanciera ? '✅ SÍ' : '❌ NO')
  if (gestionFinanciera) {
    console.error('🚀 Detalles Gestión Financiera:', JSON.stringify({
      code: gestionFinanciera.code,
      label: gestionFinanciera.label,
      orden: gestionFinanciera.orden,
      children: gestionFinanciera.children?.length || 0
    }, null, 2))
  }
  console.error('🚀 Todos los menús:', MENU_STRUCTURE.map(m => `${m.label} (${m.code}, orden: ${m.orden})`).join('\n   '))
  console.error('========================================')
  
  const [activeView, setActiveView] = useState(null)
  const [activeSubmenu, setActiveSubmenu] = useState(null)
  const [expandedMenu, setExpandedMenu] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false) // Para móvil
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Para desktop
  const [darkMode, setDarkMode] = useState(false)
  const menuRef = useRef(null)
  const sidebarRef = useRef(null)
  const { userInfo, loading: loadingUserInfo, permissions } = useUserInfo(user?.id)
  
  console.error('🚀 userInfo loaded:', userInfo)
  console.error('🚀 loadingUserInfo:', loadingUserInfo)
  console.error('🚀 permissions:', permissions)

  // Toggle modo oscuro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Debug: Forzar ejecución y mostrar información
  useEffect(() => {
    console.error('🔍 useEffect ejecutado - userInfo:', userInfo)
    console.error('🔍 useEffect ejecutado - MENU_STRUCTURE:', MENU_STRUCTURE.length)
    console.error('🔍 useEffect ejecutado - MENU_STRUCTURE items:', MENU_STRUCTURE.map(m => m.code).join(', '))
  }, [userInfo, loadingUserInfo])

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // FORZAR: Mostrar SIEMPRE TODOS los menús ordenados
  // Esto garantiza que el menú "Gestión Financiera" siempre aparezca
  const visibleMenuItems = useMemo(() => {
    try {
      console.error('🔄 ===== CALCULANDO VISIBLE MENU ITEMS =====')
      console.error('🔄 MENU_STRUCTURE length:', MENU_STRUCTURE?.length)
      
      // FORZAR: Siempre mostrar TODOS los menús, sin excepciones
      const allMenus = Array.isArray(MENU_STRUCTURE) ? [...MENU_STRUCTURE] : []
      const sortedMenu = allMenus.sort((a, b) => (a.orden || 999) - (b.orden || 999))
      
      console.error('✅ Total menús a mostrar:', sortedMenu.length)
      console.error('✅ Menús disponibles:')
      sortedMenu.forEach((m, idx) => {
        console.error(`   ${idx + 1}. ${m.label} (${m.code}, orden: ${m.orden})`)
        if (m.children) {
          m.children.forEach((child, cIdx) => {
            console.error(`      ${cIdx + 1}. ${child.label} (${child.code})`)
          })
        }
      })
      
      // Verificar específicamente Gestión Financiera
      const gestionFinanciera = sortedMenu.find(m => m.code === 'gestion-financiera')
      if (gestionFinanciera) {
        console.error('✅✅✅ GESTIÓN FINANCIERA ENCONTRADA EN MENÚ ✅✅✅')
      } else {
        console.error('❌❌❌ GESTIÓN FINANCIERA NO ENCONTRADA EN MENÚ ❌❌❌')
      }
      
      console.error('🔄 ===== FIN CALCULANDO VISIBLE MENU ITEMS =====')
      return sortedMenu
    } catch (error) {
      console.error('❌ ERROR al calcular menús:', error)
      // En caso de error, retornar MENU_STRUCTURE directamente
      return Array.isArray(MENU_STRUCTURE) ? [...MENU_STRUCTURE].sort((a, b) => (a.orden || 999) - (b.orden || 999)) : []
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
    setMenuOpen(false)
  }

  const handleMenuClick = (item) => {
    const hasSubmenu = Array.isArray(item.children) && item.children.length > 0
    
    if (hasSubmenu) {
      const nextExpanded = expandedMenu === item.code ? null : item.code
      setExpandedMenu(nextExpanded)
      if (!expandedMenu && item.children && item.children.length > 0) {
        const firstChild = item.children[0]
        setActiveView(firstChild.view_key)
        setActiveSubmenu(firstChild.code)
      }
    } else {
      setActiveView(item.view_key)
      setActiveSubmenu(null)
      setExpandedMenu(null)
    }
    
    // Cerrar sidebar en móvil después de seleccionar
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  const handleSubmenuClick = (child) => {
    setActiveView(child.view_key)
    setActiveSubmenu(child.code)
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-900 flex flex-col">
      {/* Header fijo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700 shadow-soft">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          {/* Left: Toggle menu y título */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
              aria-label="Toggle menu"
            >
              <MenuIcon />
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
              aria-label={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
            >
              <MenuIcon />
            </button>
            <h1 className="text-lg lg:text-xl font-bold text-secondary-900 dark:text-white truncate">
              Sistema de gestión de Información
              {userInfo?.clienteNombre && (
                <span className="text-primary-600 dark:text-primary-400">
                  {' '}- {userInfo.clienteNombre}
                </span>
              )}
            </h1>
          </div>

          {/* Right: Modo oscuro y menú de usuario */}
          <div className="flex items-center gap-3">
            {/* Toggle modo oscuro */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-secondary-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Menú de usuario */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                aria-label="Menú de usuario"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm">
                  {userInfo?.nombreCompleto?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <UserIcon className="hidden sm:block w-4 h-4 text-secondary-600 dark:text-secondary-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-secondary-800 rounded-xl shadow-medium border border-secondary-200 dark:border-secondary-700 overflow-hidden animate-fade-in z-50">
                  <div className="p-4 border-b border-secondary-200 dark:border-secondary-700">
                    {userInfo && (
                      <>
                        <p className="font-semibold text-secondary-900 dark:text-white truncate">
                          {userInfo.nombreCompleto}
                        </p>
                        <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-secondary-500 dark:text-secondary-500 mt-1">
                          Entidad: {userInfo.clienteNombre}
                        </p>
                      </>
                    )}
                    {!userInfo && (
                      <p className="text-sm text-secondary-600 dark:text-secondary-400 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors text-secondary-700 dark:text-secondary-300"
                  >
                    <LogoutIcon />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        {/* Sidebar - Overlay en móvil, fijo en desktop */}
        {/* Overlay para móvil */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64
            ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
            bg-white dark:bg-secondary-800 border-r border-secondary-200 dark:border-secondary-700
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            pt-4 pb-6 overflow-y-auto
          `}
        >
          <nav className="px-3 space-y-1">
            {/* Indicador visual de debug - SIEMPRE visible para diagnóstico */}
            <div className="mb-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs text-yellow-800 dark:text-yellow-200 border-2 border-yellow-400 dark:border-yellow-600">
              <strong>🔍 DEBUG MENÚ:</strong>
              <div className="mt-1">
                <div>• Menús cargados: {visibleMenuItems.length}</div>
                <div>• Rol usuario: {userInfo?.rol || (loadingUserInfo ? 'Cargando...' : 'Backend no disponible - Modo desarrollo')}</div>
                <div>• Loading: {loadingUserInfo ? 'Sí' : 'No'}</div>
                <div>• userInfo existe: {userInfo ? 'Sí' : 'No'}</div>
                <div>• MENU_STRUCTURE total: {MENU_STRUCTURE.length}</div>
                {visibleMenuItems.find(m => m.code === 'gestion-financiera') ? (
                  <div className="mt-1 text-green-600 dark:text-green-400 font-bold">✅ Gestión Financiera ENCONTRADA en visibleMenuItems</div>
                ) : (
                  <div className="mt-1 text-red-600 dark:text-red-400 font-bold">❌ Gestión Financiera NO encontrada en visibleMenuItems</div>
                )}
                {MENU_STRUCTURE.find(m => m.code === 'gestion-financiera') ? (
                  <div className="mt-1 text-green-600 dark:text-green-400">✅ Gestión Financiera existe en MENU_STRUCTURE</div>
                ) : (
                  <div className="mt-1 text-red-600 dark:text-red-400">❌ Gestión Financiera NO existe en MENU_STRUCTURE</div>
                )}
                <div className="mt-1 text-xs break-all">
                  Códigos: {visibleMenuItems.map(m => m.code).join(', ') || 'NINGUNO'}
                </div>
              </div>
            </div>
            {visibleMenuItems.length === 0 && loadingUserInfo && (
              <div className="px-3 py-2 text-sm text-secondary-500">Cargando menú...</div>
            )}
            {[...visibleMenuItems].sort((a, b) => (a.orden || 999) - (b.orden || 999)).map((item) => {
              const hasSubmenu = Array.isArray(item.children) && item.children.length > 0
              const isExpanded = expandedMenu === item.code
              const isActive = activeView === item.view_key && !hasSubmenu

              return (
                <div key={item.code}>
                  <button
                    onClick={() => handleMenuClick(item)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200
                      ${isActive
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-soft'
                        : 'text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700'
                      }
                      ${sidebarCollapsed ? 'justify-center lg:justify-center' : ''}
                    `}
                  >
                    <span className="text-xl flex-shrink-0">{getMenuIcon(item.icon)}</span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        {hasSubmenu && (
                          <ChevronDownIcon className={`w-3 h-3 text-secondary-500 dark:text-secondary-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                      </>
                    )}
                  </button>

                  {hasSubmenu && isExpanded && !sidebarCollapsed && (
                    <div className="ml-4 mt-1 space-y-1 animate-fade-in">
                      {[...(item.children || [])].sort((a, b) => (a.orden || 999) - (b.orden || 999)).map((child) => (
                        <button
                          key={child.code}
                          onClick={() => handleSubmenuClick(child)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-lg
                            transition-all duration-200
                            ${activeSubmenu === child.code
                              ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                              : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-700'
                            }
                          `}
                        >
                          <span className="text-lg">{getMenuIcon(child.icon)}</span>
                          <span className="flex-1 text-left text-sm">{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {visibleMenuItems.length === 0 && !loadingUserInfo && (
              <div className="p-4 text-center">
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-2">
                  No tienes permisos para acceder a ninguna opción del menú.
                </p>
                <p className="text-xs text-secondary-500 dark:text-secondary-500">
                  Contacta al administrador para asignarte un rol.
                </p>
              </div>
            )}
          </nav>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 lg:p-6">
            {activeView === null && (
              <div className="card text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
                    {loadingUserInfo ? (
                      'Cargando...'
                    ) : userInfo ? (
                      <>Bienvenido {userInfo.nombreCompleto}</>
                    ) : (
                      'Bienvenido'
                    )}
                  </h2>
                  {userInfo && (
                    <p className="text-secondary-600 dark:text-secondary-400 mb-4">
                      <strong>Entidad:</strong> {userInfo.clienteNombre}
                    </p>
                  )}
                  <p className="text-secondary-500 dark:text-secondary-500">
                    Selecciona una opción del menú para comenzar
                  </p>
                </div>
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
            {activeView === 'clientes-suscripcion' && userInfo?.rol === 'admin' && (
              <GestionClienteSuscripcion userInfo={userInfo} />
            )}
            {activeView === 'clientes' && <GestionCliente userInfo={userInfo} />}
            {activeView === 'roles' && userInfo?.rol === 'admin' && <GestionRoles userInfo={userInfo} />}
            {activeView === 'bancos' && <GestionBancos userInfo={userInfo} />}
            {activeView === 'conceptos-ingreso' && <GestionConceptosIngreso userInfo={userInfo} />}
            {activeView === 'ingresos' && <GestionIngresos userInfo={userInfo} />}
          </div>
        </main>
      </div>

      <ChatBubble userInfo={userInfo} />
    </div>
  )
}

export default Dashboard
