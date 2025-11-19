import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { evaluateExcelFormula } from '../utils/excelFormulaParser'
import './Cotizacion.css'

/**
 * Gestión de descuentos configurables para productos/servicios.
 * Usa una tabla de configuración (descuentos_productos_config) que
 * luego se puede aplicar en las cotizaciones.
 *
 * Si se recibe la prop "producto", se filtra por ese producto y se
 * muestra el nombre en el encabezado. Si no, se listan descuentos
 * generales (vista desde el menú Ventas → Descuentos de productos).
 */
function DescuentosProductosGestion({ userInfo, producto = null }) {
  const [descuentos, setDescuentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [enEdicion, setEnEdicion] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [mostrarAyudaFormula, setMostrarAyudaFormula] = useState(false)
  const [valorDescuentoFormateado, setValorDescuentoFormateado] = useState('')
  const [formulaCorregida, setFormulaCorregida] = useState(null)

  const [form, setForm] = useState({
    nombre: '',
    segmento_cliente: 'Gobierno Colombia',
    tipo_descuento: 'Gasto',
    base_descuento: 'Precio venta',
    formula_descuento: '',
    valor_descuento: 0,
    activo: true,
  })

  // Función para formatear número con separadores de miles y 2 decimales
  const formatearValor = (valor) => {
    if (valor === '' || valor === null || valor === undefined) return ''
    const num = Number(valor)
    if (isNaN(num)) return ''
    return num.toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Función para parsear valor formateado a número
  const parsearValor = (valorFormateado) => {
    if (!valorFormateado || valorFormateado === '') return 0
    // Remover separadores de miles (puntos) y reemplazar coma decimal por punto
    // Manejar valores negativos (mantener el signo menos)
    const valorLimpio = valorFormateado
      .replace(/\./g, '') // Remover puntos (separadores de miles)
      .replace(',', '.') // Reemplazar coma decimal por punto
    const num = Number(valorLimpio)
    return isNaN(num) ? 0 : num
  }

  const cargarDescuentos = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase.from('descuentos_productos_config').select('*').order('nombre')

      if (busqueda) {
        query = query.ilike('nombre', `%${busqueda}%`)
      }

      if (producto?.id) {
        query = query.eq('producto_servicio_id', producto.id)
      }

      const { data, error: qError } = await query
      if (qError) throw qError
      setDescuentos(data || [])
    } catch (e) {
      console.error('Error al cargar descuentos de productos:', e)
      setError('No fue posible cargar los descuentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDescuentos()
  }, [busqueda])

  const abrirNuevo = () => {
    setEnEdicion(null)
    setForm({
      nombre: '',
      segmento_cliente: 'Gobierno Colombia',
      tipo_descuento: 'Gasto',
      base_descuento: 'Precio venta',
      formula_descuento: '',
      valor_descuento: 0,
      activo: true,
    })
    setValorDescuentoFormateado('0,00')
    setMostrarFormulario(true)
  }

  const abrirEdicion = (registro) => {
    setEnEdicion(registro)
    const valor = registro.valor_descuento || 0
    setForm({
      nombre: registro.nombre || '',
      segmento_cliente: registro.segmento_cliente || 'Gobierno Colombia',
      tipo_descuento: registro.tipo_descuento || 'Gasto',
      base_descuento: registro.base_descuento || 'Precio venta',
      formula_descuento: registro.formula_descuento || '',
      valor_descuento: valor,
      activo: registro.activo ?? true,
    })
    setValorDescuentoFormateado(formatearValor(valor))
    setMostrarFormulario(true)
  }

  const limpiarFormulario = () => {
    setMostrarFormulario(false)
    setEnEdicion(null)
    setValorDescuentoFormateado('')
    setError(null)
    setFormulaCorregida(null)
  }

  const aplicarFormulaCorregida = () => {
    if (formulaCorregida) {
      setForm((prev) => ({ ...prev, formula_descuento: formulaCorregida }))
      setFormulaCorregida(null)
      setError(null)
    }
  }

  const copiarFormulaCorregida = () => {
    if (formulaCorregida) {
      navigator.clipboard.writeText(formulaCorregida).then(() => {
        // Opcional: mostrar un mensaje temporal de confirmación
        const mensajeOriginal = error
        setError('✓ Fórmula copiada al portapapeles')
        setTimeout(() => {
          setError(mensajeOriginal)
        }, 2000)
      })
    }
  }

  const guardar = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) {
      setError('El nombre del descuento es obligatorio')
      return
    }

    try {
      setGuardando(true)
      setError(null)

      // Parsear el valor formateado antes de guardar
      const valorNumerico = parsearValor(valorDescuentoFormateado)

      const payload = {
        nombre: form.nombre.trim(),
        segmento_cliente: form.segmento_cliente,
        tipo_descuento: form.tipo_descuento,
        base_descuento: form.base_descuento,
        formula_descuento: form.formula_descuento || '',
        valor_descuento: valorNumerico,
        activo: form.activo,
        cliente_id: userInfo?.clienteId || null,
        producto_servicio_id: producto?.id || null,
      }

      if (enEdicion) {
        const { error: upError } = await supabase
          .from('descuentos_productos_config')
          .update(payload)
          .eq('id', enEdicion.id)
        if (upError) throw upError
      } else {
        const { error: insError } = await supabase
          .from('descuentos_productos_config')
          .insert([payload])
        if (insError) throw insError
      }

      await cargarDescuentos()
      limpiarFormulario()
    } catch (err) {
      console.error('Error al guardar descuento de producto:', err)
      setError('No fue posible guardar el descuento')
    } finally {
      setGuardando(false)
    }
  }

  const calcularDesdeFormula = () => {
    if (!producto) {
      setError('Para calcular el descuento se requiere un producto asociado')
      return
    }

    try {
      const formula = (form.formula_descuento || '0').trim()
      if (!formula) {
        setForm((prev) => ({ ...prev, valor_descuento: 0 }))
        setValorDescuentoFormateado('0,00')
        setError(null)
        return
      }

      // Contexto con las variables del producto
      const contexto = {
        unidad_medida: producto.unidad_medida,
        costo_compra: Number(producto.costo_compra || 0),
        iva: producto.iva ? 1 : 0,
        retencion_fuente: Number(producto.retencion_fuente || 0),
        precio_venta: Number(producto.precio_venta || 0),
        activo: producto.activo ?? true ? 1 : 0,
      }

      // Evaluar usando el parser de fórmulas tipo Excel
      const resultado = evaluateExcelFormula(formula, contexto)

      setForm((prev) => ({ ...prev, valor_descuento: resultado }))
      setValorDescuentoFormateado(formatearValor(resultado))
      setError(null)
      setFormulaCorregida(null)
    } catch (e) {
      console.error('Error al calcular descuento desde fórmula:', e)
      // Capturar la fórmula corregida si está disponible
      const formulaCorregida = e.formulaCorregida || null
      setFormulaCorregida(formulaCorregida)
      
      // Remover la línea "##Fórmula corregida:" del mensaje si está presente
      let mensajeError = e.message || 'No se pudo calcular el descuento. Revisa la fórmula y asegúrate de usar sintaxis tipo Excel (IF, SUM, AVERAGE, etc.).'
      if (formulaCorregida && mensajeError.includes('##Fórmula corregida:')) {
        mensajeError = mensajeError.replace(/\n\n##Fórmula corregida:.*$/, '')
      }
      setError(mensajeError)
    }
  }

  return (
    <div className="cotizacion-container">
      <div className="cotizacion-header">
        <div>
          <h2>Gestión de descuentos de productos</h2>
          <p className="cotizacion-subtitle">
            {producto
              ? `Configura descuentos y gastos para el producto: ${producto.nombre}`
              : 'Configura descuentos y gastos que luego podrás aplicar en tus cotizaciones.'}
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={abrirNuevo}>
          <span style={{ marginRight: 6 }}>➕</span> Nuevo descuento
        </button>
      </div>

      {!mostrarFormulario && (
        <div className="cotizacion-filtros">
          <div className="form-group">
            <label>Búsqueda por nombre</label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Escribe parte del nombre del descuento"
            />
          </div>
        </div>
      )}

      {/* Formulario de descuento - aparece debajo del botón y búsqueda */}
      {mostrarFormulario && (
        <div className="descuentos-form-container">
          <div className="descuentos-form-header">
            <h3>{enEdicion ? 'Editar descuento' : 'Nuevo descuento'}</h3>
          </div>
          <form className="descuentos-form-content" onSubmit={guardar}>
            <div className="descuentos-form-grid">
              <div className="form-group">
                <label>Nombre del descuento</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Segmento de cliente</label>
                <select
                  value={form.segmento_cliente}
                  onChange={(e) =>
                    setForm({ ...form, segmento_cliente: e.target.value })
                  }
                >
                  <option value="Gobierno Colombia">Gobierno Colombia</option>
                  <option value="Privado Colombia">Privado Colombia</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tipo de descuento / gasto</label>
                <select
                  value={form.tipo_descuento}
                  onChange={(e) =>
                    setForm({ ...form, tipo_descuento: e.target.value })
                  }
                >
                  <option value="Gasto">Gasto</option>
                  <option value="Descuento entidad pública">
                    Descuento entidad pública
                  </option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Base del descuento</label>
                <select
                  value={form.base_descuento}
                  onChange={(e) =>
                    setForm({ ...form, base_descuento: e.target.value })
                  }
                >
                  <option value="Precio venta">Precio venta</option>
                  <option value="Precio antes de Iva">Precio antes de Iva</option>
                </select>
              </div>

              <div className="form-group form-group-full">
                <label>Activo</label>
                <div className="toggle-switch-container">
                  <span className={`toggle-label ${form.activo ? 'toggle-on' : 'toggle-off'}`}>
                    {form.activo ? 'ON' : 'OFF'}
                  </span>
                  <label className="toggle-switch-glass">
                    <input
                      type="checkbox"
                      checked={form.activo}
                      onChange={(e) =>
                        setForm({ ...form, activo: e.target.checked })
                      }
                    />
                    <span className="toggle-slider-glass"></span>
                  </label>
                </div>
              </div>

              <div className="form-group form-group-full">
                <label>
                  Fórmula (texto descriptivo)
                  <button
                    type="button"
                    className="btn-link"
                    style={{
                      marginLeft: 6,
                      fontSize: '0.8rem',
                      padding: 0,
                    }}
                    onClick={() => setMostrarAyudaFormula((prev) => !prev)}
                  >
                    ⓘ Ayuda
                  </button>
                </label>
                <textarea
                  rows={3}
                  value={form.formula_descuento}
                  onChange={(e) =>
                    setForm({ ...form, formula_descuento: e.target.value })
                  }
                  placeholder='Ej: IF(precio_venta > 200, precio_venta * 2%, precio_venta * 5%)'
                />
                {mostrarAyudaFormula && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: '0.8rem',
                      background: '#f9fafb',
                      borderRadius: 6,
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <strong>Variables disponibles:</strong> unidad_medida, costo_compra, iva,
                      retencion_fuente, precio_venta, activo.
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <strong>Funciones soportadas (sintaxis tipo Excel):</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        <li><code>IF(condición, valor_si_verdadero, valor_si_falso)</code> - Condicional</li>
                        <li><code>SUM(val1, val2, ...)</code> - Suma</li>
                        <li><code>AVERAGE(val1, val2, ...)</code> - Promedio</li>
                        <li><code>MAX(val1, val2, ...)</code> - Máximo</li>
                        <li><code>MIN(val1, val2, ...)</code> - Mínimo</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Ejemplos:</strong>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        <li><code>precio_venta * 11.9%</code> - 11.9% del precio</li>
                        <li><code>IF(precio_venta &gt; 200, precio_venta * 2%, precio_venta * 5%)</code> - Condicional</li>
                        <li><code>SUM(precio_venta, costo_compra) * 0.1</code> - Suma y porcentaje</li>
                        <li><code>MAX(precio_venta * 0.1, 1000)</code> - Máximo entre valores</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {producto && (
                <div className="form-group form-group-full">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={calcularDesdeFormula}
                  >
                    💾 Calcular descuento
                  </button>
                </div>
              )}

              <div className="form-group form-group-full">
                <label>Valor del descuento / gasto</label>
                <input
                  type="text"
                  value={valorDescuentoFormateado}
                  onChange={(e) => {
                    const valor = e.target.value
                    setValorDescuentoFormateado(valor)
                    // Actualizar también el valor numérico en el form
                    const valorNumerico = parsearValor(valor)
                    setForm((prev) => ({ ...prev, valor_descuento: valorNumerico }))
                  }}
                  onBlur={(e) => {
                    // Formatear al perder el foco
                    const valorNumerico = parsearValor(e.target.value)
                    setValorDescuentoFormateado(formatearValor(valorNumerico))
                    setForm((prev) => ({ ...prev, valor_descuento: valorNumerico }))
                  }}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            {/* Mensaje de error justo antes de los botones */}
            {error && (
              <div className="alert error">
                {error}
                {formulaCorregida && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#f0f9ff',
                      border: '1px solid #3b82f6',
                      borderRadius: '6px',
                      borderLeft: '4px solid #3b82f6',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        marginBottom: '8px',
                        color: '#1e40af',
                        fontSize: '0.95rem',
                      }}
                    >
                      ##Fórmula corregida:
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        background: '#ffffff',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #bfdbfe',
                        marginBottom: '8px',
                        fontSize: '0.9rem',
                        color: '#1e3a8a',
                        wordBreak: 'break-all',
                        userSelect: 'all',
                        cursor: 'text',
                      }}
                    >
                      {formulaCorregida}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={aplicarFormulaCorregida}
                        style={{
                          padding: '6px 12px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        📋 Aplicar fórmula corregida
                      </button>
                      <button
                        type="button"
                        onClick={copiarFormulaCorregida}
                        style={{
                          padding: '6px 12px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}
                      >
                        📄 Copiar al portapapeles
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botones de acción fijos y visibles */}
            <div className="descuentos-form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={limpiarFormulario}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando ? '💾 Guardando...' : '💾 Guardar descuento'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de descuentos - solo se muestra cuando NO hay formulario abierto */}
      {!mostrarFormulario && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Segmento</th>
                <th>Tipo</th>
                <th>Base</th>
                <th>Valor</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="tabla-empty">
                    Cargando descuentos...
                  </td>
                </tr>
              )}
              {!loading && descuentos.length === 0 && (
                <tr>
                  <td colSpan={7} className="tabla-empty">
                    No se encontraron descuentos configurados.
                  </td>
                </tr>
              )}
              {!loading &&
                descuentos.map((d) => (
                  <tr key={d.id}>
                    <td>{d.nombre}</td>
                    <td>{d.segmento_cliente}</td>
                    <td>{d.tipo_descuento}</td>
                    <td>{d.base_descuento}</td>
                    <td>
                      {Number(d.valor_descuento || 0).toLocaleString('es-CO', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </td>
                    <td>{d.activo ? 'Sí' : 'No'}</td>
                    <td>
                      <button
                        className="btn-link"
                        type="button"
                        onClick={() => abrirEdicion(d)}
                      >
                        <span style={{ marginRight: 4 }}>✏️</span> Editar
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default DescuentosProductosGestion


