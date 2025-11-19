import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import DescuentosProductosGestion from './DescuentosProductosGestion'
import { useDraggableModal } from '../lib/useDraggableModal'
import './Cotizacion.css'

function ProductosServiciosGestion({ userInfo }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [buscador, setBuscador] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [enEdicion, setEnEdicion] = useState(null)
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'Producto',
    unidad_medida: 'Unidad',
    costo_compra: '',
    descripcion: '',
    iva: 'Si',
    retencion_fuente: '',
    precio_venta: '',
    archivos: [],      // URLs de archivos ya cargados
    nuevosArchivos: [], // FileList de nuevos archivos a subir
  })

  const [productoDescuentos, setProductoDescuentos] = useState(null)
  const [mostrarDescuentos, setMostrarDescuentos] = useState(false)

  // Solo el modal de producto es arrastrable; el de "Configurar descuentos"
  // se mantiene fijo para evitar que se salga de la pantalla al estar anidado.
  const { modalRef: modalProductoRef, handleRef: handleProductoRef } =
    useDraggableModal(mostrarModal)

  const cargar = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: qError } = await supabase
        .from('producto_servicio')
        .select('*')
        .order('nombre')

      if (qError) throw qError
      setItems(data || [])
    } catch (err) {
      console.error('Error al cargar productos/servicios:', err)
      setError('No fue posible cargar los productos/servicios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  const abrirModal = (item = null) => {
    setEnEdicion(item)
    setForm({
      nombre: item?.nombre || '',
      tipo: item?.tipo || 'Producto',
      unidad_medida: item?.unidad_medida || 'Unidad',
      costo_compra: item?.costo_compra || '',
      descripcion: item?.descripcion || '',
      iva: item?.iva ? 'Si' : 'No',
      retencion_fuente: item?.retencion_fuente || '',
      precio_venta: item?.precio_venta || '',
      archivos: item?.archivos || [],
      nuevosArchivos: [],
    })
    setMostrarModal(true)
  }

  const cerrarModal = () => {
    setMostrarModal(false)
    setEnEdicion(null)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      setError(null)

      // Validaciones básicas
      if (!form.nombre.trim()) {
        setError('El nombre del producto es obligatorio')
        return
      }
      if (!form.precio_venta) {
        setError('El precio de venta es obligatorio')
        return
      }

      const payload = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        unidad_medida: form.unidad_medida,
        costo_compra: form.costo_compra ? Number(form.costo_compra) : null,
        descripcion: form.descripcion || null,
        iva: form.iva === 'Si',
        retencion_fuente: form.retencion_fuente
          ? Number(String(form.retencion_fuente).replace('%', '').replace(',', '.'))
          : null,
        precio_venta: form.precio_venta ? Number(form.precio_venta) : null,
        archivos: form.archivos || [],
        cliente_id: userInfo?.clienteId || null,
      }

      // Subir archivos nuevos (si los hay)
      if (form.nuevosArchivos && form.nuevosArchivos.length > 0) {
        const nuevosUrls = []
        for (const file of form.nuevosArchivos) {
          const fileExt = file.name.split('.').pop()
          const fileName = `${crypto.randomUUID()}.${fileExt}`
          const filePath = `${userInfo?.clienteId || 'sin-cliente'}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('producto_servicio_archivos')
            .upload(filePath, file, {
              upsert: false,
            })

          if (uploadError) {
            console.error('Error al subir archivo:', uploadError)
            continue
          }

          const { data: urlData } = supabase.storage
            .from('producto_servicio_archivos')
            .getPublicUrl(filePath)

          if (urlData?.publicUrl) {
            nuevosUrls.push(urlData.publicUrl)
          }
        }

        payload.archivos = [...(payload.archivos || []), ...nuevosUrls]
      }

      if (enEdicion) {
        const { error: upError } = await supabase
          .from('producto_servicio')
          .update(payload)
          .eq('id', enEdicion.id)
        if (upError) throw upError
      } else {
        const { error: insError } = await supabase.from('producto_servicio').insert([payload])
        if (insError) throw insError
      }

      await cargar()
      cerrarModal()
    } catch (err) {
      console.error('Error al guardar producto/servicio:', err)
      setError('No fue posible guardar el registro')
    }
  }

  const filtrados = items.filter((i) =>
    i.nombre?.toLowerCase().includes(buscador.trim().toLowerCase()),
  )

  return (
    <div className="cotizacion-container">
      <div className="cotizacion-header">
        <div>
          <h2>Productos y servicios</h2>
          <p>Configura los productos y servicios que se podrán usar en las cotizaciones</p>
        </div>
        <button className="btn-primary" onClick={() => abrirModal()}>
          <span style={{ marginRight: 6 }}>➕</span> Nuevo producto/servicio
        </button>
      </div>

      <div className="cotizacion-filtros">
        <div className="form-group">
          <label>Buscar</label>
          <input
            type="text"
            value={buscador}
            onChange={(e) => setBuscador(e.target.value)}
            placeholder="Escribe el nombre del producto o servicio"
          />
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Unidad</th>
              <th>Precio venta</th>
              <th>IVA</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="tabla-empty">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="tabla-empty">
                  No se encontraron productos/servicios.
                </td>
              </tr>
            )}
            {!loading &&
              filtrados.map((i) => (
                <tr key={i.id}>
                  <td>{i.nombre}</td>
                  <td>{i.tipo}</td>
                  <td>{i.unidad_medida}</td>
                  <td>
                    {i.precio_venta
                      ? Number(i.precio_venta).toLocaleString('es-CO', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })
                      : '0'}
                  </td>
                  <td>{i.iva}</td>
                  <td>
                    <button className="btn-link" onClick={() => abrirModal(i)}>
                      <span style={{ marginRight: 4 }}>✏️</span> Editar
                    </button>
                    <button
                      className="btn-link"
                      type="button"
                      onClick={() => {
                        setProductoDescuentos(i)
                        setMostrarDescuentos(true)
                      }}
                    >
                      <span style={{ marginRight: 4 }}>💸</span> Configurar descuentos
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={cerrarModal}>
          <div
            ref={modalProductoRef}
            className="modal-card modal-card-large draggable-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={handleProductoRef} className="modal-header draggable-handle">
              <h3>{enEdicion ? 'Editar producto/servicio' : 'Nuevo producto/servicio'}</h3>
              <button className="modal-close" onClick={cerrarModal}>
                ✕
              </button>
            </div>

            <form className="modal-form" onSubmit={guardar}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="Producto">Producto</option>
                  <option value="Servicio">Servicio</option>
                </select>
              </div>
              <div className="form-group">
                <label>Unidad de medida</label>
                <select
                  value={form.unidad_medida}
                  onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })}
                >
                  <option value="Unidad">Unidad</option>
                  <option value="Global">Global</option>
                  <option value="Metros">Metros</option>
                  <option value="Docena">Docena</option>
                  <option value="Licencia">Licencia</option>
                  <option value="Suscripcion">Suscripción</option>
                </select>
              </div>
              <div className="form-group">
                <label>Costo de compra</label>
                <input
                  type="number"
                  value={form.costo_compra}
                  onChange={(e) => setForm({ ...form, costo_compra: e.target.value })}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Precio de venta</label>
                <input
                  type="number"
                  value={form.precio_venta}
                  onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>IVA</label>
                <select value={form.iva} onChange={(e) => setForm({ ...form, iva: e.target.value })}>
                  <option value="Si">Si</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="form-group">
                <label>Retención en la fuente (%)</label>
                <input
                  type="text"
                  value={form.retencion_fuente}
                  onChange={(e) => setForm({ ...form, retencion_fuente: e.target.value })}
                  placeholder="Ej: 3.5"
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Archivos (imágenes, PDF, etc.)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nuevosArchivos: Array.from(e.target.files || []),
                    })
                  }
                />
                {form.archivos && form.archivos.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>Archivos existentes:</p>
                    <ul style={{ paddingLeft: 18, fontSize: '0.85rem' }}>
                      {form.archivos.map((url, idx) => (
                        <li key={idx}>
                          <a href={url} target="_blank" rel="noreferrer">
                            Archivo {idx + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <small style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Los archivos se almacenan en Supabase Storage (bucket
                  `producto_servicio_archivos`).
                </small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  💾 Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarDescuentos && productoDescuentos && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setMostrarDescuentos(false)}
        >
          <div
            className="modal-card modal-card-descuentos-producto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Configurar descuentos</h3>
              <button
                className="modal-close"
                type="button"
                onClick={() => setMostrarDescuentos(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-form">
              <DescuentosProductosGestion userInfo={userInfo} producto={productoDescuentos} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductosServiciosGestion


