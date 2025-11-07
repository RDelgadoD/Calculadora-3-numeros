import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import './ConsultaOperaciones.css'

function ConsultaOperaciones({ currentUser, userInfo }) {
  const [usuarios, setUsuarios] = useState([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [operaciones, setOperaciones] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  useEffect(() => {
    if (userInfo?.clienteId) {
      cargarUsuarios()
    }
  }, [userInfo])

  const cargarUsuarios = async () => {
    try {
      if (!userInfo?.clienteId) {
        setUsuarios([{
          id: currentUser.id,
          email: currentUser.email || currentUser.id.substring(0, 8) + '...'
        }])
        return
      }

      // Obtener todos los usuarios del mismo cliente
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('id, nombre_completo, email')
        .eq('cliente_id', userInfo.clienteId)
        .eq('activo', true)
        .order('nombre_completo')

      if (usuariosError) throw usuariosError

      // Formatear datos de usuarios
      const usuariosFormateados = usuariosData.map(u => ({
        id: u.id,
        email: u.email,
        nombre: u.nombre_completo
      }))

      setUsuarios(usuariosFormateados)
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
      // Si hay error, al menos mostrar el usuario actual
      setUsuarios([{
        id: currentUser.id,
        email: currentUser.email || currentUser.id.substring(0, 8) + '...',
        nombre: userInfo?.nombreCompleto || ''
      }])
    }
  }

  const consultarOperaciones = async () => {
    setCargando(true)
    setMensaje(null)

    try {
      if (!userInfo?.clienteId) {
        setMensaje('Error: No se pudo identificar el cliente del usuario')
        setCargando(false)
        return
      }

      let query = supabase
        .from('calculos')
        .select('*')
        .eq('cliente_id', userInfo.clienteId) // Solo cálculos del mismo cliente
        .order('created_at', { ascending: false })

      // Filtrar por usuario si está seleccionado
      if (usuarioSeleccionado) {
        query = query.eq('user_id', usuarioSeleccionado)
      }

      // Filtrar por fecha inicio
      if (fechaInicio) {
        const fechaInicioISO = new Date(fechaInicio).toISOString()
        query = query.gte('created_at', fechaInicioISO)
      }

      // Filtrar por fecha fin
      if (fechaFin) {
        const fechaFinISO = new Date(fechaFin + 'T23:59:59').toISOString()
        query = query.lte('created_at', fechaFinISO)
      }

      const { data, error } = await query

      if (error) throw error

      setOperaciones(data || [])
      
      if (data && data.length === 0) {
        setMensaje('No se encontraron registros con los filtros seleccionados')
      }
    } catch (error) {
      console.error('Error al consultar operaciones:', error)
      setMensaje('Error al consultar las operaciones')
    } finally {
      setCargando(false)
    }
  }

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '-'
    const fecha = new Date(fechaISO)
    return fecha.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportarPDF = () => {
    try {
      if (operaciones.length === 0) {
        alert('No hay datos para exportar')
        return
      }

      const doc = new jsPDF()
      
      // Título
      doc.setFontSize(16)
      doc.text('Consulta de Operaciones', 14, 15)
      
      // Información de la consulta
      doc.setFontSize(10)
      doc.text(`Fecha de consulta: ${new Date().toLocaleDateString('es-ES')}`, 14, 25)
      doc.text(`Total de registros: ${operaciones.length}`, 14, 30)

      // Preparar datos de la tabla
      const tableData = operaciones.map(op => [
        formatearFecha(op.created_at) || '',
        String(op.numero1 || ''),
        String(op.numero2 || ''),
        String(op.numero3 || ''),
        String(op.operacion || ''),
        String(op.resultado || '')
      ])

      // Agregar tabla usando autoTable
      // autoTable funciona como plugin que extiende jsPDF
      autoTable(doc, {
        startY: 35,
        head: [['Fecha', 'Número 1', 'Número 2', 'Número 3', 'Operación', 'Resultado']],
        body: tableData,
        styles: { 
          fontSize: 8,
          cellPadding: 3
        },
        headStyles: { 
          fillColor: [45, 134, 89],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { top: 35 }
      })

      // Guardar el archivo
      const fileName = `operaciones_${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Error al exportar a PDF:', error)
      alert(`Error al exportar el archivo PDF: ${error.message}. Por favor, verifica la consola para más detalles.`)
    }
  }

  const exportarExcel = () => {
    try {
      if (operaciones.length === 0) {
        alert('No hay datos para exportar')
        return
      }

      const datos = operaciones.map(op => ({
        'Fecha': formatearFecha(op.created_at),
        'Número 1': op.numero1 || '',
        'Número 2': op.numero2 || '',
        'Número 3': op.numero3 || '',
        'Operación': op.operacion || '',
        'Resultado': op.resultado || ''
      }))

      const ws = XLSX.utils.json_to_sheet(datos)
      
      // Ajustar el ancho de las columnas
      const colWidths = [
        { wch: 20 }, // Fecha
        { wch: 12 }, // Número 1
        { wch: 12 }, // Número 2
        { wch: 12 }, // Número 3
        { wch: 15 }, // Operación
        { wch: 15 }  // Resultado
      ]
      ws['!cols'] = colWidths

      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Operaciones')
      
      const fileName = `operaciones_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al exportar el archivo Excel. Por favor, verifica la consola para más detalles.')
    }
  }

  return (
    <div className="consulta-operaciones">
      <div className="consulta-header">
        <h2>Consulta de Operaciones</h2>
        <p>Filtra y consulta las operaciones realizadas</p>
      </div>

      <div className="consulta-filters">
        <div className="filter-group">
          <label htmlFor="usuario">Usuario:</label>
          <select
            id="usuario"
            value={usuarioSeleccionado}
            onChange={(e) => setUsuarioSeleccionado(e.target.value)}
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map(usuario => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nombre ? `${usuario.nombre} (${usuario.email})` : usuario.email}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="fechaInicio">Fecha Inicio:</label>
          <input
            id="fechaInicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="fechaFin">Fecha Fin:</label>
          <input
            id="fechaFin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>

        <button 
          className="btn-consultar"
          onClick={consultarOperaciones}
          disabled={cargando}
        >
          {cargando ? 'Consultando...' : 'Consultar'}
        </button>
      </div>

      {mensaje && (
        <div className="consulta-mensaje">
          {mensaje}
        </div>
      )}

      {operaciones.length > 0 && (
        <div className="consulta-results">
          <div className="results-header">
            <p className="results-count">
              {operaciones.length} registro(s) encontrado(s)
            </p>
            <div className="export-buttons">
              <button onClick={exportarPDF} className="btn-export btn-pdf">
                📄 Exportar PDF
              </button>
              <button onClick={exportarExcel} className="btn-export btn-excel">
                📊 Exportar Excel
              </button>
            </div>
          </div>

          <div className="results-grid">
            <table className="operaciones-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Número 1</th>
                  <th>Número 2</th>
                  <th>Número 3</th>
                  <th>Operación</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {operaciones.map(op => (
                  <tr key={op.id}>
                    <td>{formatearFecha(op.created_at)}</td>
                    <td>{op.numero1}</td>
                    <td>{op.numero2}</td>
                    <td>{op.numero3}</td>
                    <td className="operacion-cell">{op.operacion}</td>
                    <td className="resultado-cell">{op.resultado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConsultaOperaciones
