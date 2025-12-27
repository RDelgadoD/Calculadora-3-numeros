import { useState, useEffect } from 'react'
import './AlertasPanel.css'

// Icono de campana SVG
const BellIcon = ({ className = "w-6 h-6", hasNotifications = false }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    {hasNotifications && (
      <circle cx="18" cy="6" r="4" fill="#EF4444" />
    )}
  </svg>
)

function AlertasPanel({ userInfo }) {
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(false)

  // Simular carga de alertas (aquí se conectaría con el backend)
  useEffect(() => {
    loadAlerts()
  }, [userInfo])

  const loadAlerts = async () => {
    setLoading(true)
    try {
      // TODO: Conectar con el backend para obtener alertas reales
      // Por ahora, usar datos de ejemplo
      const mockAlerts = [
        {
          id: 1,
          tipo: 'warning',
          titulo: 'Contrato próximo a vencer',
          mensaje: 'El contrato #12345 vence en 7 días',
          fecha: new Date(),
          leida: false
        },
        {
          id: 2,
          tipo: 'info',
          titulo: 'Nuevo ingreso registrado',
          mensaje: 'Se ha registrado un nuevo ingreso de $1,500,000',
          fecha: new Date(Date.now() - 3600000),
          leida: false
        },
        {
          id: 3,
          tipo: 'success',
          titulo: 'Tarea completada',
          mensaje: 'La tarea "Revisar documentos" ha sido completada',
          fecha: new Date(Date.now() - 7200000),
          leida: true
        }
      ]
      setAlerts(mockAlerts)
    } catch (error) {
      console.error('Error al cargar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = alerts.filter(a => !a.leida).length

  const toggleAlerts = () => {
    setAlertsOpen(!alertsOpen)
  }

  const markAsRead = (alertId) => {
    setAlerts(alerts.map(alert => 
      alert.id === alertId ? { ...alert, leida: true } : alert
    ))
  }

  const markAllAsRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, leida: true })))
  }

  const deleteAlert = (alertId) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId))
  }

  const getAlertIcon = (tipo) => {
    switch (tipo) {
      case 'warning':
        return '⚠️'
      case 'error':
        return '❌'
      case 'success':
        return '✅'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const getAlertColor = (tipo) => {
    switch (tipo) {
      case 'warning':
        return 'border-l-yellow-500'
      case 'error':
        return 'border-l-red-500'
      case 'success':
        return 'border-l-green-500'
      case 'info':
      default:
        return 'border-l-blue-500'
    }
  }

  return (
    <>
      {/* Botón de campana fijo en la barra lateral derecha */}
      <div className="alertas-panel-wrapper">
        <button
          onClick={toggleAlerts}
          className="alertas-toggle-button"
          aria-label="Ver alertas"
        >
          <BellIcon hasNotifications={unreadCount > 0} />
          {unreadCount > 0 && (
            <span className="alertas-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </button>

        {/* Panel de alertas */}
        {alertsOpen && (
          <>
            <div 
              className="alertas-overlay"
              onClick={() => setAlertsOpen(false)}
            />
            <div className="alertas-panel">
              <div className="alertas-panel-header">
                <h3>Alertas y Notificaciones</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="alertas-mark-all-read"
                  >
                    Marcar todas como leídas
                  </button>
                )}
                <button
                  onClick={() => setAlertsOpen(false)}
                  className="alertas-close-button"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              <div className="alertas-panel-content">
                {loading ? (
                  <div className="alertas-loading">Cargando alertas...</div>
                ) : alerts.length === 0 ? (
                  <div className="alertas-empty">
                    <BellIcon className="w-12 h-12 text-gray-400" />
                    <p>No hay alertas pendientes</p>
                  </div>
                ) : (
                  <div className="alertas-list">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`alerta-item ${getAlertColor(alert.tipo)} ${!alert.leida ? 'alerta-unread' : ''}`}
                        onClick={() => !alert.leida && markAsRead(alert.id)}
                      >
                        <div className="alerta-icon">
                          {getAlertIcon(alert.tipo)}
                        </div>
                        <div className="alerta-content">
                          <div className="alerta-header">
                            <h4>{alert.titulo}</h4>
                            {!alert.leida && <span className="alerta-dot"></span>}
                          </div>
                          <p>{alert.mensaje}</p>
                          <span className="alerta-time">
                            {new Date(alert.fecha).toLocaleString('es-CO', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteAlert(alert.id)
                          }}
                          className="alerta-delete"
                          aria-label="Eliminar alerta"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default AlertasPanel
