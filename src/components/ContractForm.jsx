/**
 * Formulario de contratos con accordion
 * Incluye: Datos básicos, Documentos adjuntos, Cuotas, Obligaciones
 */

import { useState, useEffect } from 'react'
import { contractsService } from '../services/contractsService'
import { clientsService } from '../services/clientsService'
import { configService } from '../services/configService'
import AttachmentsSection from './AttachmentsSection'
import InstallmentsSection from './InstallmentsSection'
import ObligationsSection from './ObligationsSection'
import './ContractForm.css'

function ContractForm({ contract: initialContract, onClose, userInfo }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [configs, setConfigs] = useState(null)
  const [clients, setClients] = useState([])
  const [contract, setContract] = useState(initialContract)
  
  // Accordion state
  const [activeSection, setActiveSection] = useState('datos-basicos')
  
  // Form data
  const [formData, setFormData] = useState({
    numero_contrato: '',
    fecha_inicio: '',
    fecha_terminacion: '',
    fecha_liquidacion: '',
    client_id: '',
    valor_contrato: '',
    objeto_contrato: '',
    tipo_contrato_id: '',
    estado_contrato_id: ''
  })

  // Sub-entities
  const [attachments, setAttachments] = useState([])
  const [installments, setInstallments] = useState([])
  const [obligations, setObligations] = useState([])

  useEffect(() => {
    loadInitialData()
    if (initialContract) {
      setContract(initialContract)
      loadContractData()
    }
  }, [initialContract])

  const loadInitialData = async () => {
    try {
      const [configsData, clientsData] = await Promise.all([
        configService.getAll(),
        clientsService.list({ limit: 100 })
      ])

      setConfigs(configsData.data)
      setClients(clientsData.data || [])

      // Set defaults
      if (!initialContract && configsData.data) {
        setFormData(prev => ({
          ...prev,
          tipo_contrato_id: configsData.data.tiposContratos[0]?.id || '',
          estado_contrato_id: configsData.data.estadosContratos[0]?.id || ''
        }))
      }
    } catch (err) {
      setError(`Error al cargar datos: ${err.message}`)
    }
  }

  const loadContractData = async () => {
    if (!contract?.id) return

    setLoading(true)
    try {
      // Obtener contrato completo desde el servidor
      const contractResponse = await contractsService.getById(contract.id)
      const fullContract = contractResponse.data
      
      setContract(fullContract)
      
      setFormData({
        numero_contrato: fullContract.numero_contrato || '',
        fecha_inicio: fullContract.fecha_inicio || '',
        fecha_terminacion: fullContract.fecha_terminacion || '',
        fecha_liquidacion: fullContract.fecha_liquidacion || '',
        client_id: fullContract.client_id || '',
        valor_contrato: fullContract.valor_contrato || '',
        objeto_contrato: fullContract.objeto_contrato || '',
        tipo_contrato_id: fullContract.tipo_contrato_id || '',
        estado_contrato_id: fullContract.estado_contrato_id || ''
      })

      // Cargar sub-entidades
      const [attachmentsData, installmentsData, obligationsData] = await Promise.all([
        contractsService.getAttachments(fullContract.id),
        contractsService.getInstallments(fullContract.id),
        contractsService.getObligations(fullContract.id)
      ])

      setAttachments(attachmentsData.data || [])
      setInstallments(installmentsData.data || [])
      setObligations(obligationsData.data || [])
    } catch (err) {
      setError(`Error al cargar contrato: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevenir propagación
    setLoading(true)
    setError(null)

    try {
      // Preparar datos: convertir fechas vacías a null
      const dataToSend = {
        ...formData,
        // Convertir cadenas vacías de fechas opcionales a null
        fecha_terminacion: formData.fecha_terminacion?.trim() || null,
        fecha_liquidacion: formData.fecha_liquidacion?.trim() || null
      }

      if (contract) {
        await contractsService.update(contract.id, dataToSend)
        onClose()
      } else {
        const response = await contractsService.create(dataToSend)
        // Si es nuevo, actualizar el contrato local para que tenga ID
        if (response.data?.id) {
          setContract({ id: response.data.id })
          // Recargar datos del contrato para tener el ID completo
          await loadContractData()
          // No cerrar el formulario, permitir agregar sub-entidades
          setError(null)
        } else {
          onClose()
        }
      }
    } catch (err) {
      setError(err.message || 'Error al guardar el contrato')
    } finally {
      setLoading(false)
    }
  }

  const handleReloadSubEntities = async () => {
    if (!contract?.id) return
    
    try {
      const [attachmentsData, installmentsData, obligationsData] = await Promise.all([
        contractsService.getAttachments(contract.id),
        contractsService.getInstallments(contract.id),
        contractsService.getObligations(contract.id)
      ])

      setAttachments(attachmentsData.data || [])
      setInstallments(installmentsData.data || [])
      setObligations(obligationsData.data || [])
    } catch (err) {
      console.error('Error al recargar sub-entidades:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section)
  }

  const getClientName = (client) => {
    if (client.tipo === 'juridica') {
      return client.razon_social || '-'
    }
    return `${client.nombre1 || ''} ${client.apellido1 || ''}`.trim() || '-'
  }

  if (!configs) {
    return (
      <div className="contract-form-overlay">
        <div className="contract-form-modal">
          <div className="loading">Cargando...</div>
        </div>
      </div>
    )
  }

  const handleOverlayClick = (e) => {
    // Solo cerrar si se hace clic directamente en el overlay, no en sus hijos
    // Y solo si NO es un evento de submit de un formulario
    if (e.target === e.currentTarget && e.type !== 'submit') {
      onClose()
    }
  }

  // Prevenir que cualquier evento de submit cierre el formulario
  const handleOverlayMouseDown = (e) => {
    // Si el clic comenzó dentro del modal o en un formulario, no cerrar
    const target = e.target
    const isFormElement = target.tagName === 'FORM' || 
                         target.closest('form') !== null ||
                         target.tagName === 'BUTTON' ||
                         target.tagName === 'INPUT' ||
                         target.tagName === 'SELECT' ||
                         target.tagName === 'TEXTAREA'
    
    if (isFormElement || target !== e.currentTarget) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div 
      className="contract-form-overlay" 
      onClick={handleOverlayClick} 
      onMouseDown={handleOverlayMouseDown}
    >
      <div 
        className="contract-form-modal" 
        onClick={(e) => e.stopPropagation()} 
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // Prevenir que ESC cierre si hay un formulario activo
          if (e.key === 'Escape' && (e.target.tagName === 'FORM' || e.target.closest('form'))) {
            e.stopPropagation()
          }
        }}
      >
        <div className="contract-form-header">
          <h2>{contract ? 'Modificar Contrato' : 'Nuevo Contrato'}</h2>
          <button className="btn-close" onClick={onClose} type="button">×</button>
        </div>

        {error && (
          <div className="mensaje error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="contract-form" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          {/* Accordion: Datos Básicos */}
          <div className="accordion-section">
            <div 
              className="accordion-header"
              onClick={() => toggleSection('datos-basicos')}
            >
              <h3>Datos Básicos</h3>
              <span>{activeSection === 'datos-basicos' ? '−' : '+'}</span>
            </div>
            {activeSection === 'datos-basicos' && (
              <div className="accordion-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="numero_contrato">Número de Contrato *</label>
                    <input
                      id="numero_contrato"
                      name="numero_contrato"
                      type="text"
                      value={formData.numero_contrato}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fecha_inicio">Fecha Inicio *</label>
                    <input
                      id="fecha_inicio"
                      name="fecha_inicio"
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fecha_terminacion">Fecha Terminación</label>
                    <input
                      id="fecha_terminacion"
                      name="fecha_terminacion"
                      type="date"
                      value={formData.fecha_terminacion}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="fecha_liquidacion">Fecha Liquidación</label>
                    <input
                      id="fecha_liquidacion"
                      name="fecha_liquidacion"
                      type="date"
                      value={formData.fecha_liquidacion}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="client_id">Contratante *</label>
                    <select
                      id="client_id"
                      name="client_id"
                      value={formData.client_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>
                          {getClientName(client)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="valor_contrato">Valor Contrato *</label>
                    <input
                      id="valor_contrato"
                      name="valor_contrato"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor_contrato}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label htmlFor="objeto_contrato">Objeto Contrato *</label>
                    <textarea
                      id="objeto_contrato"
                      name="objeto_contrato"
                      value={formData.objeto_contrato}
                      onChange={handleChange}
                      rows="4"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="tipo_contrato_id">Tipo Contrato *</label>
                    <select
                      id="tipo_contrato_id"
                      name="tipo_contrato_id"
                      value={formData.tipo_contrato_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione...</option>
                      {configs.tiposContratos.map(tipo => (
                        <option key={tipo.id} value={tipo.id}>
                          {tipo.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="estado_contrato_id">Estado Contrato *</label>
                    <select
                      id="estado_contrato_id"
                      name="estado_contrato_id"
                      value={formData.estado_contrato_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione...</option>
                      {configs.estadosContratos.map(estado => (
                        <option key={estado.id} value={estado.id}>
                          {estado.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion: Documentos Adjuntos */}
          <div className="accordion-section">
            <div 
              className="accordion-header"
              onClick={() => toggleSection('adjuntos')}
            >
              <h3>Documentos Adjuntos ({attachments.length})</h3>
              <span>{activeSection === 'adjuntos' ? '−' : '+'}</span>
            </div>
            {activeSection === 'adjuntos' && contract?.id && (
              <div className="accordion-content" onClick={(e) => e.stopPropagation()}>
                <AttachmentsSection
                  contractId={contract.id}
                  userInfo={userInfo}
                  attachments={attachments}
                  onUpdate={handleReloadSubEntities}
                />
              </div>
            )}
            {activeSection === 'adjuntos' && !contract?.id && (
              <div className="accordion-content">
                <p className="info-text">Guarda el contrato primero para agregar documentos adjuntos</p>
              </div>
            )}
          </div>

          {/* Accordion: Cuotas de Pago */}
          <div className="accordion-section">
            <div 
              className="accordion-header"
              onClick={() => toggleSection('cuotas')}
            >
              <h3>Cuotas de Pago ({installments.length})</h3>
              <span>{activeSection === 'cuotas' ? '−' : '+'}</span>
            </div>
            {activeSection === 'cuotas' && contract?.id && (
              <div className="accordion-content" onClick={(e) => e.stopPropagation()}>
                <InstallmentsSection
                  contractId={contract.id}
                  valorContrato={formData.valor_contrato || contract?.valor_contrato}
                  installments={installments}
                  onUpdate={handleReloadSubEntities}
                />
              </div>
            )}
            {activeSection === 'cuotas' && !contract?.id && (
              <div className="accordion-content">
                <p className="info-text">Guarda el contrato primero para agregar cuotas de pago</p>
              </div>
            )}
          </div>

          {/* Accordion: Obligaciones */}
          <div className="accordion-section">
            <div 
              className="accordion-header"
              onClick={() => toggleSection('obligaciones')}
            >
              <h3>Obligaciones ({obligations.length})</h3>
              <span>{activeSection === 'obligaciones' ? '−' : '+'}</span>
            </div>
            {activeSection === 'obligaciones' && contract?.id && (
              <div className="accordion-content" onClick={(e) => e.stopPropagation()}>
                <ObligationsSection
                  contractId={contract.id}
                  userInfo={userInfo}
                  obligations={obligations}
                  onUpdate={handleReloadSubEntities}
                />
              </div>
            )}
            {activeSection === 'obligaciones' && !contract?.id && (
              <div className="accordion-content">
                <p className="info-text">Guarda el contrato primero para agregar obligaciones</p>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ContractForm

