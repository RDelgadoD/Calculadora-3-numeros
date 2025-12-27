import { useState, useEffect, useMemo } from 'react'
import { ingresosService } from '../services/ingresosService'
import { bancosService } from '../services/bancosService'
import { conceptosIngresoService } from '../services/conceptosIngresoService'
import { contractsService } from '../services/contractsService'
import './Admin.css'

const BANCOS_DISPONIBLES = [
  'Banco de Occidente',
  'Banco de Bogotá',
  'Bancolombia',
  'Banco Davivienda',
  'Banco Mundo mujer',
  'Banco Caja Social',
  'Banco Av Villas'
]

const CONCEPTOS_PREDEFINIDOS = [
  'Pago contrato',
  'Devolución',
  'Aporte socios',
  'Ventas en efectivo',
  'Otros'
]

function GestionIngresos({ userInfo }) {
  const [ingresos, setIngresos] = useState([])
  const [bancos, setBancos] = useState([])
  const [conceptos, setConceptos] = useState([])
  const [contratos, setContratos] = useState([])
  const [buscador, setBuscador] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [ingresoEnEdicion, setIngresoEnEdicion] = useState(null)
  
  // Estados para buscadores
  const [buscarCuentaBancaria, setBuscarCuentaBancaria] = useState('')
  const [cuentasBancariasFiltradas, setCuentasBancariasFiltradas] = useState([])
  const [mostrarCuentasBancarias, setMostrarCuentasBancarias] = useState(false)
  
  const [buscarContrato, setBuscarContrato] = useState('')
  const [contratosFiltrados, setContratosFiltrados] = useState([])
  const [mostrarContratos, setMostrarContratos] = useState(false)
  
  const [formulario, setFormulario] = useState({
    fecha_ingreso: new Date().toISOString().split('T')[0],
    concepto_ingreso: 'Pago contrato',
    banco: '',
    cuenta_bancaria_id: null,
    valor_ingreso: '',
    contrato_id: null
  })
  const [estado, setEstado] = useState({ tipo: null, mensaje: null })
  const [guardando, setGuardando] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (formulario.banco && mostrarModal) {
      loadCuentasBancarias()
    } else if (!formulario.banco && mostrarModal) {
      setCuentasBancariasFiltradas([])
      setFormulario(prev => ({ ...prev, cuenta_bancaria_id: null }))
    }
  }, [formulario.banco, mostrarModal])

  useEffect(() => {
    if (formulario.concepto_ingreso === 'Pago contrato') {
      loadContratos()
    } else {
      setContratosFiltrados([])
      setFormulario(prev => ({ ...prev, contrato_id: null }))
    }
  }, [formulario.concepto_ingreso])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setEstado({ tipo: null, mensaje: null })
      
      const [ingresosData, conceptosData] = await Promise.all([
        ingresosService.list({ limit: 100 }).catch(() => ({ data: [] })),
        conceptosIngresoService.list({ limit: 100 }).catch(() => ({ data: [] }))
      ])

      setIngresos(ingresosData.data || [])
      
      // Si no hay conceptos en el backend, usar predefinidos
      if (!conceptosData.data || conceptosData.data.length === 0) {
        setConceptos(CONCEPTOS_PREDEFINIDOS)
      } else {
        setConceptos(conceptosData.data.map(c => c.nombre || c))
      }
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setEstado({ tipo: 'error', mensaje: 'Error al cargar datos' })
      setIngresos([])
      setConceptos(CONCEPTOS_PREDEFINIDOS)
    } finally {
      setLoading(false)
    }
  }

  // Función helper para obtener el nombre del contratante
  const obtenerNombreContratante = (cliente) => {
    if (!cliente) return ''
    // Priorizar razon_social (empresas), luego nombre completo (personas naturales)
    return cliente.razon_social || 
           `${cliente.nombre1 || ''} ${cliente.apellido1 || ''}`.trim() ||
           cliente.nombre || ''
  }

  const loadCuentasBancarias = async () => {
    try {
      const response = await bancosService.searchByBanco(formulario.banco, buscarCuentaBancaria)
      const cuentas = response.data || []
      setCuentasBancariasFiltradas(cuentas)
    } catch (error) {
      console.error('Error al cargar cuentas bancarias:', error)
      setCuentasBancariasFiltradas([])
    }
  }

  const loadContratos = async () => {
    try {
      const response = await contractsService.list({ limit: 100 })
      const contratosData = response.data || []
      setContratos(contratosData)
      
      // Filtrar contratos según búsqueda - si no hay búsqueda, mostrar todos
      const termino = buscarContrato.trim().toLowerCase()
      if (!termino) {
        // Si no hay término de búsqueda, mostrar todos los contratos
        setContratosFiltrados(contratosData)
      } else {
        // Filtrar por búsqueda
        const filtrados = contratosData.filter(contrato => {
          const numero = contrato.numero_contrato || ''
          const clienteNombre = obtenerNombreContratante(contrato.cliente)
          return numero.toLowerCase().includes(termino) || 
                 clienteNombre.toLowerCase().includes(termino)
        })
        setContratosFiltrados(filtrados)
      }
    } catch (error) {
      console.error('Error al cargar contratos:', error)
      setContratos([])
      setContratosFiltrados([])
    }
  }

  const ingresosFiltrados = useMemo(() => {
    const termino = buscador.trim().toLowerCase()
    if (!termino) return ingresos
    return ingresos.filter((ingreso) => {
      const concepto = ingreso.concepto_ingreso || ''
      const banco = ingreso.banco || ''
      const valor = ingreso.valor_ingreso?.toString() || ''
      return concepto.toLowerCase().includes(termino) || 
             banco.toLowerCase().includes(termino) ||
             valor.includes(termino)
    })
  }, [ingresos, buscador])

  const abrirModal = (ingreso = null) => {
    setIngresoEnEdicion(ingreso)
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(true)
    
    // Si estamos editando, cargar el ingreso completo desde el backend
    if (ingreso?.id) {
      ingresosService.getById(ingreso.id)
        .then(response => {
          if (response.data) {
            const ingresoCompleto = response.data
            
            // Obtener datos para el formulario
            const bancoNombre = ingresoCompleto.banco || ingresoCompleto.cuenta_bancaria?.banco_nombre || ''
            const conceptoNombre = ingresoCompleto.concepto_ingreso || ingresoCompleto.concepto_ingreso_obj?.nombre || 'Pago contrato'
            
            // Preparar texto de cuenta bancaria si existe
            let textoCuentaBancaria = ''
            if (ingresoCompleto.cuenta_bancaria) {
              textoCuentaBancaria = `${ingresoCompleto.cuenta_bancaria.tipo_cuenta} - ${ingresoCompleto.cuenta_bancaria.numero_cuenta}`
            }
            
            // Preparar texto de contrato si existe
            let textoContrato = ''
            if (ingresoCompleto.contrato) {
              const clienteNombre = obtenerNombreContratante(ingresoCompleto.contrato.cliente)
              if (clienteNombre && ingresoCompleto.contrato.numero_contrato) {
                textoContrato = `${clienteNombre} - ${ingresoCompleto.contrato.numero_contrato}`
              } else if (ingresoCompleto.contrato.numero_contrato) {
                textoContrato = ingresoCompleto.contrato.numero_contrato
              }
            }
            
            setFormulario({
              fecha_ingreso: ingresoCompleto.fecha_ingreso ? ingresoCompleto.fecha_ingreso.split('T')[0] : new Date().toISOString().split('T')[0],
              concepto_ingreso: conceptoNombre,
              banco: bancoNombre,
              cuenta_bancaria_id: ingresoCompleto.cuenta_bancaria_id || null,
              valor_ingreso: ingresoCompleto.valor_ingreso ? ingresoCompleto.valor_ingreso.toString() : '',
              contrato_id: ingresoCompleto.contrato_id || null
            })
            
            // Establecer los textos de búsqueda para mostrar los valores seleccionados
            setBuscarCuentaBancaria(textoCuentaBancaria)
            setBuscarContrato(textoContrato)
            
            // Cargar las cuentas bancarias para el banco seleccionado
            if (bancoNombre) {
              // Primero actualizar el formulario con el banco, luego cargar cuentas
              setTimeout(() => {
                // Usar el banco del formulario que ya fue actualizado
                setFormulario(prev => ({ ...prev, banco: bancoNombre }))
                setTimeout(() => {
                  loadCuentasBancarias()
                }, 100)
              }, 100)
            }
            
            // Cargar TODOS los contratos cuando el concepto es "Pago contrato"
            // Esto asegura que todos los contratos estén disponibles en el dropdown
            if (conceptoNombre === 'Pago contrato') {
              // Limpiar búsqueda para mostrar todos los contratos
              setBuscarContrato(textoContrato || '')
              setTimeout(() => {
                loadContratos()
              }, 300)
            }
          }
        })
        .catch(error => {
          console.error('Error al cargar ingreso completo:', error)
          // Usar los datos que ya tenemos del ingreso
          inicializarFormulario(ingreso)
        })
    } else {
      // Si es un ingreso nuevo, inicializar formulario vacío
      inicializarFormulario(null)
    }
  }
  
  const inicializarFormulario = (ingreso) => {
    const bancoNombre = ingreso?.banco || ingreso?.cuenta_bancaria?.banco_nombre || ''
    const conceptoNombre = ingreso?.concepto_ingreso || ingreso?.concepto_ingreso_obj?.nombre || 'Pago contrato'
    
    setFormulario({
      fecha_ingreso: ingreso?.fecha_ingreso ? ingreso.fecha_ingreso.split('T')[0] : new Date().toISOString().split('T')[0],
      concepto_ingreso: conceptoNombre,
      banco: bancoNombre,
      cuenta_bancaria_id: ingreso?.cuenta_bancaria_id || null,
      valor_ingreso: ingreso?.valor_ingreso ? ingreso.valor_ingreso.toString() : '',
      contrato_id: ingreso?.contrato_id || null
    })
    
    if (ingreso?.cuenta_bancaria) {
      setBuscarCuentaBancaria(`${ingreso.cuenta_bancaria.tipo_cuenta} - ${ingreso.cuenta_bancaria.numero_cuenta}`)
    } else {
      setBuscarCuentaBancaria('')
    }
    
    if (ingreso?.contrato) {
      const clienteNombre = obtenerNombreContratante(ingreso.contrato.cliente)
      if (clienteNombre && ingreso.contrato.numero_contrato) {
        setBuscarContrato(`${clienteNombre} - ${ingreso.contrato.numero_contrato}`)
      } else {
        setBuscarContrato(ingreso.contrato.numero_contrato || '')
      }
    } else {
      setBuscarContrato('')
    }
  }

  const cerrarModal = () => {
    setIngresoEnEdicion(null)
    setFormulario({
      fecha_ingreso: new Date().toISOString().split('T')[0],
      concepto_ingreso: 'Pago contrato',
      banco: '',
      cuenta_bancaria_id: null,
      valor_ingreso: '',
      contrato_id: null
    })
    setBuscarCuentaBancaria('')
    setBuscarContrato('')
    setEstado({ tipo: null, mensaje: null })
    setMostrarModal(false)
    setMostrarCuentasBancarias(false)
    setMostrarContratos(false)
  }

  const formatearMoneda = (valor) => {
    if (!valor) return ''
    const numero = typeof valor === 'string' ? parseFloat(valor.replace(/[^\d]/g, '')) : valor
    if (isNaN(numero)) return ''
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numero)
  }

  const formatearMonedaInput = (valor) => {
    if (!valor) return ''
    // Remover todo excepto números
    const soloNumeros = valor.toString().replace(/[^\d]/g, '')
    if (!soloNumeros) return ''
    
    // Formatear con separadores de miles
    const numero = parseInt(soloNumeros, 10)
    if (isNaN(numero)) return ''
    
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numero)
  }

  const parsearMoneda = (valor) => {
    if (!valor) return ''
    // Remover todos los caracteres no numéricos
    return valor.toString().replace(/[^\d]/g, '')
  }

  const guardar = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setEstado({ tipo: null, mensaje: null })

    try {
      // Validar valor > 0
      const valorNumerico = parseFloat(parsearMoneda(formulario.valor_ingreso))
      if (isNaN(valorNumerico) || valorNumerico <= 0) {
        setEstado({ tipo: 'error', mensaje: 'El valor del ingreso debe ser mayor a cero' })
        setGuardando(false)
        return
      }

      // Preparar datos - NO incluir 'banco' porque no existe esa columna en la tabla
      const ingresoData = {
        fecha_ingreso: formulario.fecha_ingreso,
        concepto_ingreso: formulario.concepto_ingreso,
        cuenta_bancaria_id: formulario.cuenta_bancaria_id,
        valor_ingreso: valorNumerico,
        contrato_id: formulario.concepto_ingreso === 'Pago contrato' ? formulario.contrato_id : null
      }

      if (ingresoEnEdicion) {
        await ingresosService.update(ingresoEnEdicion.id, ingresoData)
        setEstado({ tipo: 'success', mensaje: 'Ingreso actualizado correctamente' })
      } else {
        await ingresosService.create(ingresoData)
        setEstado({ tipo: 'success', mensaje: 'Ingreso creado correctamente' })
      }

      // Cerrar el modal primero para evitar que se reabra
      setMostrarModal(false)
      setIngresoEnEdicion(null)
      setEstado({ tipo: null, mensaje: null })
      
      // Limpiar el formulario después de cerrar el modal
      setFormulario({
        fecha_ingreso: new Date().toISOString().split('T')[0],
        concepto_ingreso: 'Pago contrato',
        banco: '',
        cuenta_bancaria_id: null,
        valor_ingreso: '',
        contrato_id: null
      })
      setBuscarCuentaBancaria('')
      setBuscarContrato('')
      setMostrarCuentasBancarias(false)
      setMostrarContratos(false)
      
      // Recargar datos
      await loadInitialData()
    } catch (error) {
      console.error('Error al guardar ingreso:', error)
      setEstado({
        tipo: 'error',
        mensaje: error.error?.message || error.message || 'No fue posible guardar el ingreso',
      })
    } finally {
      setGuardando(false)
    }
  }

  const seleccionarCuentaBancaria = (cuenta) => {
    setFormulario(prev => ({ ...prev, cuenta_bancaria_id: cuenta.id }))
    setBuscarCuentaBancaria(`${cuenta.tipo_cuenta} - ${cuenta.numero_cuenta}`)
    setMostrarCuentasBancarias(false)
  }

  const seleccionarContrato = (contrato) => {
    setFormulario(prev => ({ ...prev, contrato_id: contrato.id }))
    const clienteNombre = obtenerNombreContratante(contrato.cliente)
    const textoContrato = clienteNombre && contrato.numero_contrato
      ? `${clienteNombre} - ${contrato.numero_contrato}`
      : contrato.numero_contrato || ''
    setBuscarContrato(textoContrato)
    setMostrarContratos(false)
  }

  const getConceptoDisplay = (ingreso) => {
    // El modelo carga concepto_ingreso como string directamente
    return ingreso.concepto_ingreso || ingreso.concepto_ingreso_obj?.nombre || '-'
  }

  const getBancoDisplay = (ingreso) => {
    // El modelo carga banco desde cuenta_bancaria
    return ingreso.banco || ingreso.cuenta_bancaria?.banco_nombre || '-'
  }

  const getCuentaDisplay = (ingreso) => {
    if (ingreso.cuenta_bancaria) {
      return `${ingreso.cuenta_bancaria.tipo_cuenta} - ${ingreso.cuenta_bancaria.numero_cuenta}`
    }
    return '-'
  }

  const getContratoDisplay = (ingreso) => {
    if (ingreso.contrato) {
      const clienteNombre = obtenerNombreContratante(ingreso.contrato.cliente)
      if (clienteNombre && ingreso.contrato.numero_contrato) {
        return `${clienteNombre} - ${ingreso.contrato.numero_contrato}`
      }
      return ingreso.contrato.numero_contrato || '-'
    }
    return '-'
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h2>Gestión de Ingresos</h2>
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Gestión de Ingresos</h2>
        <p>Administra los ingresos de la empresa</p>
      </div>

      <div className="clientes-admin">
        <div className="clientes-toolbar">
          <div className="clientes-search">
            <input
              type="text"
              placeholder="Buscar ingreso..."
              value={buscador}
              onChange={(event) => setBuscador(event.target.value)}
            />
            <button className="btn-primary" onClick={() => abrirModal()}>
              <span style={{ marginRight: '6px' }}>➕</span> Nuevo Ingreso
            </button>
          </div>
        </div>

        {estado.mensaje && estado.tipo === 'error' && (
          <div className={`alert ${estado.tipo}`}>{estado.mensaje}</div>
        )}

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Banco</th>
                <th>Cuenta Bancaria</th>
                <th>Valor</th>
                <th>Contrato</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ingresosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="tabla-empty">
                    No se encontraron ingresos. Crea uno nuevo para empezar.
                  </td>
                </tr>
              )}
              {ingresosFiltrados.map((ingreso) => (
                <tr key={ingreso.id}>
                  <td>{ingreso.fecha_ingreso ? new Date(ingreso.fecha_ingreso).toLocaleDateString('es-CO') : '-'}</td>
                  <td>{getConceptoDisplay(ingreso)}</td>
                  <td>{getBancoDisplay(ingreso)}</td>
                  <td>{getCuentaDisplay(ingreso)}</td>
                  <td>{formatearMoneda(ingreso.valor_ingreso)}</td>
                  <td>{getContratoDisplay(ingreso)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-link" onClick={() => abrirModal(ingreso)}>
                        <span style={{ marginRight: '4px' }}>✏️</span> Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mostrarModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" onClick={cerrarModal}>
            <div className="modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{ingresoEnEdicion ? 'Editar ingreso' : 'Nuevo ingreso'}</h3>
                <button className="modal-close" onClick={cerrarModal} aria-label="Cerrar">
                  ×
                </button>
              </div>

              <form onSubmit={guardar} className="modal-form">
                <div className="form-group">
                  <label htmlFor="ingreso-fecha">Fecha del Ingreso *</label>
                  <input
                    id="ingreso-fecha"
                    type="date"
                    value={formulario.fecha_ingreso}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        fecha_ingreso: event.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ingreso-concepto">Concepto del Ingreso *</label>
                  <select
                    id="ingreso-concepto"
                    value={formulario.concepto_ingreso}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        concepto_ingreso: event.target.value,
                        contrato_id: event.target.value !== 'Pago contrato' ? null : formulario.contrato_id
                      })
                    }
                    required
                  >
                    {conceptos.map((concepto) => (
                      <option key={concepto} value={concepto}>
                        {concepto}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="ingreso-banco">Banco *</label>
                  <select
                    id="ingreso-banco"
                    value={formulario.banco}
                    onChange={(event) =>
                      setFormulario({
                        ...formulario,
                        banco: event.target.value,
                        cuenta_bancaria_id: null
                      })
                    }
                    required
                  >
                    <option value="">Seleccione un banco...</option>
                    {BANCOS_DISPONIBLES.map((banco) => (
                      <option key={banco} value={banco}>
                        {banco}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="ingreso-cuenta-bancaria">Cuenta Bancaria *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="ingreso-cuenta-bancaria"
                      type="text"
                      value={buscarCuentaBancaria}
                      onChange={(event) => {
                        setBuscarCuentaBancaria(event.target.value)
                        setMostrarCuentasBancarias(true)
                        if (formulario.banco) {
                          loadCuentasBancarias()
                        }
                      }}
                      onFocus={() => {
                        if (formulario.banco) {
                          setMostrarCuentasBancarias(true)
                          loadCuentasBancarias()
                        }
                      }}
                      placeholder="Buscar cuenta bancaria..."
                      required
                      disabled={!formulario.banco}
                    />
                    {mostrarCuentasBancarias && cuentasBancariasFiltradas.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        {cuentasBancariasFiltradas.map((cuenta) => (
                          <div
                            key={cuenta.id}
                            onClick={() => seleccionarCuentaBancaria(cuenta)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                          >
                            {cuenta.tipo_cuenta} - {cuenta.numero_cuenta}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="ingreso-valor">Valor del Ingreso *</label>
                  <input
                    id="ingreso-valor"
                    type="text"
                    value={formulario.valor_ingreso ? formatearMonedaInput(formulario.valor_ingreso) : ''}
                    onChange={(event) => {
                      const valor = event.target.value
                      // Permitir solo números y formatear mientras se escribe
                      const valorLimpio = parsearMoneda(valor)
                      setFormulario({
                        ...formulario,
                        valor_ingreso: valorLimpio
                      })
                    }}
                    onBlur={(event) => {
                      // Al perder el foco, formatear completamente
                      const valorLimpio = parsearMoneda(event.target.value)
                      if (valorLimpio) {
                        event.target.value = formatearMonedaInput(valorLimpio)
                      }
                    }}
                    placeholder="0"
                    required
                  />
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Formato: 1.000.000
                  </small>
                </div>

                {formulario.concepto_ingreso === 'Pago contrato' && (
                  <div className="form-group">
                    <label htmlFor="ingreso-contrato">Contrato</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="ingreso-contrato"
                        type="text"
                        value={buscarContrato}
                        onChange={(event) => {
                          setBuscarContrato(event.target.value)
                          setMostrarContratos(true)
                          loadContratos()
                        }}
                        onFocus={() => {
                          setMostrarContratos(true)
                          loadContratos()
                        }}
                        placeholder="Buscar contrato (Cliente - Número contrato)..."
                      />
                      {mostrarContratos && contratosFiltrados.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          {contratosFiltrados.map((contrato) => {
                            const clienteNombre = obtenerNombreContratante(contrato.cliente)
                            const textoContrato = clienteNombre && contrato.numero_contrato
                              ? `${clienteNombre} - ${contrato.numero_contrato}`
                              : contrato.numero_contrato || '-'
                            return (
                              <div
                                key={contrato.id}
                                onClick={() => seleccionarContrato(contrato)}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #eee'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                              >
                                {textoContrato}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {estado.mensaje && (
                  <div className={`alert ${estado.tipo}`}>{estado.mensaje}</div>
                )}

                <div className="modal-actions">
                  <button type="submit" className="btn-primary" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={cerrarModal}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GestionIngresos
