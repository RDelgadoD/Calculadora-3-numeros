import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Calculadora from './Calculadora'
import ConsultaOperaciones from './ConsultaOperaciones'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

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
                  <p className="user-email">{user.email}</p>
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
          </div>
        </nav>

        <div className="dashboard-content-area">
          {activeView === null && (
            <div className="empty-state">
              <h2>Bienvenido</h2>
              <p>Selecciona una opción del menú para comenzar</p>
            </div>
          )}
          {activeView === 'calculadora' && <Calculadora user={user} />}
          {activeView === 'consulta' && <ConsultaOperaciones currentUser={user} />}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
