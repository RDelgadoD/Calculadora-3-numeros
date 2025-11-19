import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { roleService } from '../services/roleService'
import GestionTenant from './GestionTenant'
import './Admin.css'

function Admin({ userInfo, activeSubmenu = 'tenant' }) {

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Administración del Sistema</h2>
        <p>Gestiona clientes, usuarios y roles del sistema</p>
      </div>

      <div className="admin-submenu">
        <button
          className={`admin-submenu-item ${activeSubmenu === 'tenant' ? 'active' : ''}`}
          onClick={() => window.location.hash = 'admin-tenant'}
        >
          Gestión de Tenant - Clientes y usuarios
        </button>
      </div>

      {activeSubmenu === 'tenant' && (
        <GestionTenant userInfo={userInfo} />
      )}
    </div>
  )
}

export default Admin
