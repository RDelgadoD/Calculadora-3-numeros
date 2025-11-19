/**
 * Utilidades para formatear respuestas del chat
 */

/**
 * Campos que no deben mostrarse al usuario
 */
const HIDDEN_FIELDS = [
  'id',
  'created_at',
  'created_by',
  'updated_at',
  'cliente_id',
  'client_id',
  'tipo_contrato_id',
  'estado_contrato_id',
  'tipo_actividad_id',
  'producto_id',
  'estado_obligacion_id',
  'estado_pago_id',
  'tipo_documento_id',
  'tipo_identificacion',
  'usuario_upload',
  'responsable_id',
  'contract_id'
]

/**
 * Mapeo de nombres de campos a etiquetas amigables en español
 */
const FIELD_LABELS = {
  // Contratos
  'numero_contrato': 'Número de contrato',
  'fecha_inicio': 'Fecha de Inicio',
  'fecha_terminacion': 'Fecha de terminación',
  'fecha_liquidacion': 'Fecha de liquidación',
  'valor_contrato': 'Valor del contrato',
  'objeto_contrato': 'Objeto del contrato',
  
  // Clients (contratantes)
  'nombre1': 'Primer nombre',
  'nombre2': 'Segundo nombre',
  'apellido1': 'Primer apellido',
  'apellido2': 'Segundo apellido',
  'razon_social': 'Razón social',
  'nro_identificacion': 'Número de identificación',
  'direccion': 'Dirección',
  'telefono': 'Teléfono',
  'tipo': 'Tipo',
  
  // Clientes (tenants)
  'nombre': 'Nombre',
  'activo': 'Estado',
  
  // Usuarios
  'nombre_completo': 'Nombre completo',
  'email': 'Email',
  'rol': 'Rol',
  
  // Cuotas
  'nombre_pago': 'Nombre del pago',
  'valor': 'Valor',
  'fecha_cobro': 'Fecha de cobro',
  
  // Obligaciones
  'descripcion': 'Descripción',
  
  // Campos de conteo y agregación
  'count': 'Cantidad',
  'total': 'Total',
  'average': 'Promedio',
  'sum': 'Suma'
}

/**
 * Formatear un valor según su tipo
 */
function formatValue(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return null // No mostrar valores nulos
  }

  // Formatear fechas
  if (fieldName.includes('fecha') || fieldName.includes('date') || fieldName.includes('created_at') || fieldName.includes('updated_at')) {
    if (typeof value === 'string') {
      // Intentar parsear fecha
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0] // YYYY-MM-DD
      }
    }
  }

  // Formatear valores monetarios
  if (fieldName.includes('valor') || fieldName.includes('precio') || fieldName.includes('monto')) {
    const numValue = parseFloat(value)
    if (!isNaN(numValue)) {
      return numValue.toLocaleString('es-CO', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0,
        useGrouping: true
      })
    }
  }

  // Formatear booleanos
  if (typeof value === 'boolean') {
    return value ? 'Activo' : 'Inactivo'
  }

  return value
}

/**
 * Formatear un registro para mostrar al usuario
 */
export function formatRecord(record, tableName = '') {
  const formattedFields = []
  
  for (const [key, value] of Object.entries(record)) {
    // Omitir campos ocultos
    if (HIDDEN_FIELDS.some(field => key.includes(field))) {
      continue
    }

    // Omitir valores nulos
    const formattedValue = formatValue(value, key)
    if (formattedValue === null) {
      continue
    }

    // Obtener etiqueta amigable (traducir al español)
    let label = FIELD_LABELS[key]
    if (!label) {
      // Si no está en el mapeo, convertir snake_case a español
      label = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        // Traducciones comunes
        .replace(/Count/gi, 'Cantidad')
        .replace(/Total/gi, 'Total')
        .replace(/Average/gi, 'Promedio')
    }
    
    formattedFields.push({
      label,
      value: formattedValue,
      key
    })
  }

  return formattedFields
}

/**
 * Formatear lista de registros para respuesta del chat
 */
export function formatRecordsList(records, tableName = '') {
  if (!records || records.length === 0) {
    return 'No se encontraron registros.'
  }

  const formattedItems = records.map((record, idx) => {
    const fields = formatRecord(record, tableName)
    
    if (fields.length === 0) {
      return `${idx + 1}. (Sin información disponible)`
    }

    // Formatear como: "Campo: Valor | Campo2: Valor2"
    const formatted = fields.map(f => {
      // Asegurar que "Count" se traduzca a "Cantidad"
      const label = f.label.replace(/Count/gi, 'Cantidad')
      return `${label}: ${f.value}`
    }).join(' | ')
    return `${idx + 1}.\t${formatted}`
  })

  return `Se encontraron ${records.length} registro(s):\n\n${formattedItems.join('\n\n')}`
}

