import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useUserInfo } from '../lib/useUserInfo'
import Calculadora from './Calculadora'
import ConsultaOperaciones from './ConsultaOperaciones'
import Admin from './Admin'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const { userInfo, loading: loadingUserInfo } = useUserInfo(user?.id)

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
    setMenuOpen(false)
  }

  return (
    <div className="dashboard">
      <div className="dashboard-topbar">
        <div className="topbar-left">
          <h1>Calculadora de 3 Números</h1>
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
        <nav className="dashboard-sidebar">
          <div className="sidebar-section">
            <button
              className={`nav-item ${activeView === 'calculadora' ? 'active' : ''}`}
              onClick={() => setActiveView('calculadora')}
            >
              <span className="nav-icon">🧮</span>
              <span className="nav-text">Calculadora</span>
            </button>
            <button
              className={`nav-item ${activeView === 'consulta' ? 'active' : ''}`}
              onClick={() => setActiveView('consulta')}
            >
              <span className="nav-icon">📊</span>
              <span className="nav-text">Consulta de operaciones</span>
            </button>
            {userInfo?.rol === 'admin' && (
              <button
                className={`nav-item ${activeView === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveView('admin')}
              >
                <span className="nav-icon">⚙️</span>
                <span className="nav-text">Administración</span>
              </button>
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
          {activeView === 'calculadora' && (
            <Calculadora
              user={user}
              userInfo={userInfo}
              loadingUserInfo={loadingUserInfo}
            />
          )}
          {activeView === 'consulta' && <ConsultaOperaciones currentUser={user} userInfo={userInfo} />}
          {activeView === 'admin' && userInfo?.rol === 'admin' && <Admin userInfo={userInfo} />}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
