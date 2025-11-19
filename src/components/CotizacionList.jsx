import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useDraggableModal } from '../lib/useDraggableModal'
import './Cotizacion.css'

function CotizacionList({ userInfo }) {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtros, setFiltros] = useState({
    clienteId: '',
    fechaDesde: '',
    fechaHasta: '',
  })

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null)

  // datos para el formulario
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState({
    fecha_cotizacion: '',
    client_id: '',
    observacion: '',
    fecha_fin_vigencia: '',
    estado_cotizacion: 'Nuevo',
  })
  const [items, setItems] = useState([]) // productos de la cotización
  const [descuentos, setDescuentos] = useState([])
  const [totales, setTotales] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [activeSection, setActiveSection] = useState('datos-basicos')

  const { modalRef, handleRef } = useDraggableModal(mostrarFormulario)

  const cargarCotizaciones = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('cotizaciones')
        .select(
          `
          *,
          clients (
            id,
            razon_social,
            nombre1,
            apellido1
          )
        `
        )
        .order('fecha_cotizacion', { ascending: false })

      if (filtros.clienteId) {
        query = query.eq('client_id', filtros.clienteId)
      }
      if (filtros.fechaDesde) {
        query = query.gte('fecha_cotizacion', filtros.fechaDesde)
      }
      if (filtros.fechaHasta) {
        query = query.lte('fecha_cotizacion', filtros.fechaHasta)
      }

      const { data, error: qError } = await query

      if (qError) throw qError
      setCotizaciones(data || [])
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err)
      setError('No fue posible cargar las cotizaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userInfo?.clienteId) {
      cargarCotizaciones()
    }
  }, [userInfo, filtros.clienteId, filtros.fechaDesde, filtros.fechaHasta])

  const abrirNuevaCotizacion = () => {
    setCotizacionSeleccionada(null)
    abrirFormularioDetalle(null)
  }

  const editarCotizacion = (cotizacion) => {
    setCotizacionSeleccionada(cotizacion)
    abrirFormularioDetalle(cotizacion)
  }

  const cerrarFormulario = (debeRecargar = false) => {
    setMostrarFormulario(false)
    setCotizacionSeleccionada(null)
    if (debeRecargar) {
      cargarCotizaciones()
    }
  }

  const obtenerNombreCliente = (c) => {
    if (!c) return 'Sin cliente'
    if (c.razon_social) return c.razon_social
    return `${c.nombre1 || ''} ${c.apellido1 || ''}`.trim() || 'Sin cliente'
  }

  const cargarDatosFormulario = async () => {
    try {
      // clientes
      const { data: cli, error: cliErr } = await supabase
        .from('clients')
        .select('id, razon_social, nombre1, apellido1')
        .eq('cliente_id', userInfo?.clienteId || null)
        .order('razon_social')
      if (cliErr) throw cliErr
      setClientes(cli || [])

      // productos
      const { data: prods, error: prodErr } = await supabase
        .from('producto_servicio')
        .select('id, nombre, unidad_medida, precio_venta')
        .order('nombre')
      if (prodErr) throw prodErr
      setProductos(prods || [])
    } catch (e) {
      console.error('Error cargando datos de formulario de cotización:', e)
    }
  }

  const abrirFormularioDetalle = async (cotizacion = null) => {
    await cargarDatosFormulario()

    if (cotizacion) {
      setForm({
        fecha_cotizacion: cotizacion.fecha_cotizacion || '',
        client_id: cotizacion.client_id || '',
        observacion: cotizacion.observacion || '',
        fecha_fin_vigencia: cotizacion.fecha_fin_vigencia || '',
        estado_cotizacion: cotizacion.estado_cotizacion || 'Nuevo',
      })

      // cargar items y descuentos asociados
      const { data: itemsData } = await supabase
        .from('cotizacion_producto')
        .select('id, producto_servicio_id, cantidad, precio_venta, unidad_medida')
        .eq('cotizacion_id', cotizacion.id)

      const { data: descData } = await supabase
        .from('descuentos_cotizacion')
        .select('id, segmento_cliente, tipo_descuento, base_descuento, formula_descuento, valor_descuento')
        .eq('cotizacion_id', cotizacion.id)

      setItems(itemsData || [])
      setDescuentos(descData || [])
      calcularTotales(itemsData || [], descData || [])
    } else {
      setForm({
        fecha_cotizacion: new Date().toISOString().slice(0, 10),
        client_id: '',
        observacion: '',
        fecha_fin_vigencia: '',
        estado_cotizacion: 'Nuevo',
      })
      setItems([])
      setDescuentos([])
      setTotales(null)
    }

    setMostrarFormulario(true)
  }

  const agregarItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        producto_servicio_id: '',
        cantidad: 1,
        precio_venta: 0,
        unidad_medida: '',
        esNuevo: true,
      },
    ])
  }

  const actualizarItem = (index, campo, valor) => {
    setItems((prev) => {
      const copia = [...prev]
      const item = { ...copia[index], [campo]: valor }

      // si cambia el producto, traer unidad y precio por defecto
      if (campo === 'producto_servicio_id') {
        const prod = productos.find((p) => p.id === valor)
        if (prod) {
          item.unidad_medida = prod.unidad_medida
          item.precio_venta = prod.precio_venta
        }
      }

      copia[index] = item
      return copia
    })
  }

  const eliminarItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  const agregarDescuento = () => {
    setDescuentos((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        segmento_cliente: 'Gobierno Colombia',
        tipo_descuento: 'Gasto',
        base_descuento: 'Precio venta',
        formula_descuento: '',
        valor_descuento: 0,
        esNuevo: true,
      },
    ])
  }

  const actualizarDescuento = (index, campo, valor) => {
    setDescuentos((prev) => {
      const copia = [...prev]
      copia[index] = { ...copia[index], [campo]: valor }
      return copia
    })
  }

  const eliminarDescuento = (index) => {
    setDescuentos((prev) => prev.filter((_, idx) => idx !== index))
  }

  const calcularTotales = (itemsInput = items, descInput = descuentos) => {
    const totalCotizacion = itemsInput.reduce(
      (acc, i) => acc + Number(i.cantidad || 0) * Number(i.precio_venta || 0),
      0
    )
    const totalDescuentos = descInput.reduce(
      (acc, d) => acc + Number(d.valor_descuento || 0),
      0
    )
    const ganancia = totalCotizacion - totalDescuentos
    const utilidad = totalCotizacion > 0 ? (ganancia / totalCotizacion) * 100 : 0

    setTotales({
      totalCotizacion,
      totalDescuentos,
      ganancia,
      utilidad,
    })
  }

  const guardarCotizacion = async (e) => {
    e.preventDefault()
    if (!userInfo?.clienteId) {
      setError('No se pudo determinar el cliente del sistema')
      return
    }
    if (!form.client_id) {
      setError('Selecciona un cliente para la cotización')
      return
    }

    try {
      setGuardando(true)
      setError(null)

      let cotizacionId = cotizacionSeleccionada?.id

      if (cotizacionSeleccionada) {
        // actualizar cabecera
        const { error: upErr } = await supabase
          .from('cotizaciones')
          .update({
            fecha_cotizacion: form.fecha_cotizacion,
            client_id: form.client_id,
            observacion: form.observacion,
            fecha_fin_vigencia: form.fecha_fin_vigencia || null,
            estado_cotizacion: form.estado_cotizacion,
          })
          .eq('id', cotizacionId)
        if (upErr) throw upErr

        // simplificación: borrar items y descuentos y volver a insertar
        await supabase.from('cotizacion_producto').delete().eq('cotizacion_id', cotizacionId)
        await supabase.from('descuentos_cotizacion').delete().eq('cotizacion_id', cotizacionId)
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('cotizaciones')
          .insert([
            {
              cliente_id: userInfo.clienteId,
              fecha_cotizacion: form.fecha_cotizacion,
              client_id: form.client_id,
              observacion: form.observacion,
              fecha_fin_vigencia: form.fecha_fin_vigencia || null,
              estado_cotizacion: form.estado_cotizacion,
              valor_total: 0,
              created_by: userInfo.id,
            },
          ])
          .select()
          .single()

        if (insErr) throw insErr
        cotizacionId = inserted.id
      }

      // insertar items
      if (items.length > 0) {
        const itemsToInsert = items
          .filter((i) => i.producto_servicio_id)
          .map((i) => ({
            cotizacion_id: cotizacionId,
            producto_servicio_id: i.producto_servicio_id,
            cantidad: Number(i.cantidad || 0),
            precio_venta: Number(i.precio_venta || 0),
            unidad_medida: i.unidad_medida,
          }))

        if (itemsToInsert.length) {
          const { error: itemsErr } = await supabase
            .from('cotizacion_producto')
            .insert(itemsToInsert)
          if (itemsErr) throw itemsErr
        }
      }

      // insertar descuentos
      if (descuentos.length > 0) {
        const descToInsert = descuentos.map((d) => ({
          cotizacion_id: cotizacionId,
          segmento_cliente: d.segmento_cliente,
          tipo_descuento: d.tipo_descuento,
          base_descuento: d.base_descuento,
          formula_descuento: d.formula_descuento || '',
          valor_descuento: Number(d.valor_descuento || 0),
        }))

        const { error: descErr } = await supabase
          .from('descuentos_cotizacion')
          .insert(descToInsert)
        if (descErr) throw descErr
      }

      // actualizar totales en la cabecera
      calcularTotales()
      const t = totales ||
        (() => {
          const totalCotizacion = items.reduce(
            (acc, i) => acc + Number(i.cantidad || 0) * Number(i.precio_venta || 0),
            0
          )
          const totalDescuentos = descuentos.reduce(
            (acc, d) => acc + Number(d.valor_descuento || 0),
            0
          )
          const ganancia = totalCotizacion - totalDescuentos
          const utilidad = totalCotizacion > 0 ? (ganancia / totalCotizacion) * 100 : 0
          return { totalCotizacion, totalDescuentos, ganancia, utilidad }
        })()

      await supabase
        .from('cotizaciones')
        .update({ valor_total: t.totalCotizacion })
        .eq('id', cotizacionId)

      cerrarFormulario(true)
    } catch (err) {
      console.error('Error al guardar cotización:', err)
      setError('No fue posible guardar la cotización')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="cotizacion-container">
      <div className="cotizacion-header">
        <div>
          <h2>Gestión de Cotizaciones</h2>
          <p>Registra y consulta las cotizaciones de productos y servicios</p>
        </div>
        <button className="btn-primary" onClick={abrirNuevaCotizacion}>
          <span style={{ marginRight: 6 }}>➕</span> Nueva cotización
        </button>
      </div>

      <div className="cotizacion-filtros">
        <div className="form-group">
          <label>Fecha desde</label>
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Fecha hasta</label>
          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
          />
        </div>
        {/* En una versión posterior se puede agregar un selector de clientes */}
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Estado</th>
              <th>Valor total</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="tabla-empty">
                  Cargando cotizaciones...
                </td>
              </tr>
            )}
            {!loading && cotizaciones.length === 0 && (
              <tr>
                <td colSpan={6} className="tabla-empty">
                  No se encontraron cotizaciones.
                </td>
              </tr>
            )}
            {!loading &&
              cotizaciones.map((c) => (
                <tr key={c.id}>
                  <td>{c.numero_cotizacion}</td>
                  <td>
                    {c.fecha_cotizacion
                      ? new Date(c.fecha_cotizacion).toLocaleDateString('es-CO')
                      : ''}
                  </td>
                  <td>{obtenerNombreCliente(c.clients)}</td>
                  <td>{c.estado_cotizacion}</td>
                  <td>
                    {c.valor_total
                      ? Number(c.valor_total).toLocaleString('es-CO', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                      : '0'}
                  </td>
                  <td>
                    <button className="btn-link" onClick={() => editarCotizacion(c)}>
                      <span style={{ marginRight: 4 }}>✏️</span> Editar
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {mostrarFormulario && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => cerrarFormulario(false)}
        >
          <div
            ref={modalRef}
            className="modal-card modal-card-large draggable-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={handleRef} className="modal-header draggable-handle">
              <h3>{cotizacionSeleccionada ? 'Editar cotización' : 'Nueva cotización'}</h3>
              <button className="modal-close" onClick={() => cerrarFormulario(false)}>
                ✕
              </button>
            </div>

            <form className="modal-form" onSubmit={guardarCotizacion}>
              {/* Acordeón: Datos básicos */}
              <div className="accordion-section">
                <div
                  className="accordion-header"
                  onClick={() =>
                    setActiveSection((prev) => (prev === 'datos-basicos' ? '' : 'datos-basicos'))
                  }
                >
                  <h3>Datos básicos</h3>
                  <span>{activeSection === 'datos-basicos' ? '−' : '+'}</span>
                </div>
                {activeSection === 'datos-basicos' && (
                  <div className="accordion-content">
                    <div className="form-group">
                      <label>Fecha de cotización</label>
                      <input
                        type="date"
                        value={form.fecha_cotizacion}
                        onChange={(e) =>
                          setForm({ ...form, fecha_cotizacion: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Cliente</label>
                      <select
                        value={form.client_id}
                        onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                        required
                      >
                        <option value="">Seleccione un cliente</option>
                        {clientes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.razon_social ||
                              `${c.nombre1 || ''} ${c.apellido1 || ''}`.trim() ||
                              'Sin nombre'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Fecha finalización cotización</label>
                      <input
                        type="date"
                        value={form.fecha_fin_vigencia || ''}
                        onChange={(e) =>
                          setForm({ ...form, fecha_fin_vigencia: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Estado de la cotización</label>
                      <select
                        value={form.estado_cotizacion}
                        onChange={(e) =>
                          setForm({ ...form, estado_cotizacion: e.target.value })
                        }
                      >
                        <option value="Nuevo">Nuevo</option>
                        <option value="Enviado al cliente">Enviado al cliente</option>
                        <option value="Finalizado">Finalizado</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Observación</label>
                      <textarea
                        rows={3}
                        value={form.observacion}
                        onChange={(e) =>
                          setForm({ ...form, observacion: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Acordeón: Productos y servicios */}
              <div className="accordion-section">
                <div
                  className="accordion-header"
                  onClick={() =>
                    setActiveSection((prev) => (prev === 'productos' ? '' : 'productos'))
                  }
                >
                  <h3>Productos y servicios</h3>
                  <span>{activeSection === 'productos' ? '−' : '+'}</span>
                </div>
                {activeSection === 'productos' && (
                  <div className="accordion-content">
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Producto / servicio</th>
                            <th>Cantidad</th>
                            <th>Unidad</th>
                            <th>Precio venta</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => (
                            <tr key={item.id || idx}>
                              <td>
                                <select
                                  value={item.producto_servicio_id}
                                  onChange={(e) =>
                                    actualizarItem(idx, 'producto_servicio_id', e.target.value)
                                  }
                                >
                                  <option value="">Seleccione...</option>
                                  {productos.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.nombre}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.cantidad}
                                  onChange={(e) =>
                                    actualizarItem(idx, 'cantidad', e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={item.unidad_medida || ''}
                                  onChange={(e) =>
                                    actualizarItem(idx, 'unidad_medida', e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.precio_venta}
                                  onChange={(e) =>
                                    actualizarItem(idx, 'precio_venta', e.target.value)
                                  }
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-link"
                                  onClick={() => eliminarItem(idx)}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                          {items.length === 0 && (
                            <tr>
                              <td colSpan={5} className="tabla-empty">
                                No hay productos asociados. Usa "Agregar producto" para añadir uno.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <button type="button" className="btn-secondary" onClick={agregarItem}>
                      ➕ Agregar producto
                    </button>
                  </div>
                )}
              </div>

              {/* Acordeón: Descuentos / gastos */}
              <div className="accordion-section">
                <div
                  className="accordion-header"
                  onClick={() =>
                    setActiveSection((prev) => (prev === 'descuentos' ? '' : 'descuentos'))
                  }
                >
                  <h3>Descuentos / gastos de la cotización</h3>
                  <span>{activeSection === 'descuentos' ? '−' : '+'}</span>
                </div>
                {activeSection === 'descuentos' && (
                  <div className="accordion-content">
                    <div className="admin-table-wrapper">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Segmento cliente</th>
                            <th>Tipo descuento</th>
                            <th>Base descuento</th>
                            <th>Fórmula (texto)</th>
                            <th>Valor descuento</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {descuentos.map((d, idx) => (
                            <tr key={d.id || idx}>
                              <td>
                                <select
                                  value={d.segmento_cliente}
                                  onChange={(e) =>
                                    actualizarDescuento(
                                      idx,
                                      'segmento_cliente',
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="Gobierno Colombia">Gobierno Colombia</option>
                                  <option value="Privado Colombia">Privado Colombia</option>
                                </select>
                              </td>
                              <td>
                                <select
                                  value={d.tipo_descuento}
                                  onChange={(e) =>
                                    actualizarDescuento(idx, 'tipo_descuento', e.target.value)
                                  }
                                >
                                  <option value="Gasto">Gasto</option>
                                  <option value="Descuento entidad pública">
                                    Descuento entidad pública
                                  </option>
                                  <option value="Otro">Otro</option>
                                </select>
                              </td>
                              <td>
                                <select
                                  value={d.base_descuento}
                                  onChange={(e) =>
                                    actualizarDescuento(idx, 'base_descuento', e.target.value)
                                  }
                                >
                                  <option value="Precio venta">Precio venta</option>
                                  <option value="Precio antes de Iva">
                                    Precio antes de Iva
                                  </option>
                                </select>
                              </td>
                              <td>
                                <input
                                  type="text"
                                  value={d.formula_descuento}
                                  onChange={(e) =>
                                    actualizarDescuento(
                                      idx,
                                      'formula_descuento',
                                      e.target.value
                                    )
                                  }
                                  placeholder='Ej: SI(Base="Precio venta", Precio*10%, 0)'
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  value={d.valor_descuento}
                                  onChange={(e) =>
                                    actualizarDescuento(
                                      idx,
                                      'valor_descuento',
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-link"
                                  onClick={() => eliminarDescuento(idx)}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                          {descuentos.length === 0 && (
                            <tr>
                              <td colSpan={6} className="tabla-empty">
                                No hay descuentos asociados. Usa "Agregar descuento" para añadir
                                uno.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={agregarDescuento}
                    >
                      ➕ Agregar descuento
                    </button>
                  </div>
                )}
              </div>

              {/* Acordeón: Totales */}
              <div className="accordion-section">
                <div
                  className="accordion-header"
                  onClick={() =>
                    setActiveSection((prev) => (prev === 'totales' ? '' : 'totales'))
                  }
                >
                  <h3>Totales de la cotización</h3>
                  <span>{activeSection === 'totales' ? '−' : '+'}</span>
                </div>
                {activeSection === 'totales' && (
                  <div className="accordion-content">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => calcularTotales()}
                    >
                      Calcular totales
                    </button>
                    {totales && (
                      <div style={{ marginTop: 12, fontSize: '0.9rem' }}>
                        <p>
                          <strong>Total cotización:</strong>{' '}
                          {totales.totalCotizacion.toLocaleString('es-CO')}
                        </p>
                        <p>
                          <strong>Total descuentos / gastos:</strong>{' '}
                          {totales.totalDescuentos.toLocaleString('es-CO')}
                        </p>
                        <p>
                          <strong>Ganancia:</strong>{' '}
                          {totales.ganancia.toLocaleString('es-CO')}
                        </p>
                        <p>
                          <strong>Utilidad:</strong> {totales.utilidad.toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: 24 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => cerrarFormulario(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={guardando}>
                  {guardando ? '💾 Guardando...' : '💾 Guardar cotización'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CotizacionList


