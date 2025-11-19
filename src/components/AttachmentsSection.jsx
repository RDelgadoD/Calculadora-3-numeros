/**
 * Componente para gestionar documentos adjuntos
 * Permite subir, ver y eliminar archivos usando Supabase Storage
 */

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { contractsService } from '../services/contractsService'
import { configService } from '../services/configService'
import './AttachmentsSection.css'

function AttachmentsSection({ contractId, userInfo, attachments, onUpdate }) {
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [tiposDocumentos, setTiposDocumentos] = useState([])
  const [formData, setFormData] = useState({
    tipo_documento_id: '',
    observaciones: '',
    archivo: null
  })

  const loadTiposDocumentos = async () => {
    try {
      const response = await configService.getTiposDocumentos()
      setTiposDocumentos(response.data || [])
    } catch (error) {
      console.error('Error al cargar tipos de documentos:', error)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('El archivo no puede ser mayor a 10MB')
        return
      }
      setFormData(prev => ({ ...prev, archivo: file }))
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    e.stopPropagation() // Prevenir que el evento se propague al formulario padre
    
    if (!formData.tipo_documento_id) {
      alert('Selecciona un tipo de documento')
      return
    }

    if (!formData.archivo) {
      alert('Selecciona un archivo')
      return
    }

    setUploading(true)

    try {
      // 1. Subir archivo a Supabase Storage
      const fileExt = formData.archivo.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      // El path NO debe incluir el nombre del bucket, solo la ruta dentro del bucket
      const filePath = `${contractId}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, formData.archivo, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error detallado al subir archivo:', uploadError)
        throw uploadError
      }

      // 2. Obtener URL pública del archivo
      const { data: { publicUrl } } = supabase.storage
        .from('contracts')
        .getPublicUrl(filePath)

      // 3. Crear registro en la tabla attachments
      await contractsService.createAttachment(contractId, {
        tipo_documento_id: formData.tipo_documento_id,
        archivo: publicUrl,
        observaciones: formData.observaciones || null
      })

      // 4. Limpiar formulario PRIMERO
      setFormData({
        tipo_documento_id: '',
        observaciones: '',
        archivo: null
      })
      setShowUploadForm(false)
      
      // Limpiar input file
      const fileInput = document.getElementById('archivo-upload')
      if (fileInput) fileInput.value = ''
      
      // 5. Recargar adjuntos DESPUÉS de limpiar (para evitar que el formulario se cierre)
      setTimeout(() => {
        onUpdate()
      }, 100)
    } catch (error) {
      console.error('Error al subir archivo:', error)
      alert(`Error al subir archivo: ${error.message || 'Error desconocido'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (attachmentId, archivoUrl) => {
    if (!confirm('¿Estás seguro de eliminar este adjunto?')) return

    try {
      // Extraer path del archivo de la URL
      // La URL de Supabase Storage tiene formato: https://[project].supabase.co/storage/v1/object/public/contracts/[path]
      const urlParts = archivoUrl.split('/')
      // Buscar el índice después de 'public' o 'contracts'
      const contractsIndex = urlParts.findIndex(part => part === 'contracts')
      if (contractsIndex === -1) {
        throw new Error('No se pudo extraer el path del archivo de la URL')
      }
      // El path es todo lo que viene después de 'contracts'
      const filePath = urlParts.slice(contractsIndex + 1).join('/')

      // Eliminar de Storage (el path NO debe incluir el nombre del bucket)
      await supabase.storage
        .from('contracts')
        .remove([filePath])

      // Eliminar registro de la BD
      await contractsService.deleteAttachment(contractId, attachmentId)

      // Recargar adjuntos
      onUpdate()
    } catch (error) {
      console.error('Error al eliminar adjunto:', error)
      alert(`Error al eliminar: ${error.message || 'Error desconocido'}`)
    }
  }

  const getFileName = (url) => {
    if (!url) return 'Sin nombre'
    const parts = url.split('/')
    return parts[parts.length - 1] || 'Archivo'
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div className="attachments-section" onClick={(e) => e.stopPropagation()}>
      <div className="section-header">
        <h4>Documentos Adjuntos</h4>
        <button
          type="button"
          className="btn-add"
          onClick={() => {
            if (!showUploadForm) {
              loadTiposDocumentos()
            }
            setShowUploadForm(!showUploadForm)
          }}
        >
          {showUploadForm ? '✕ Cancelar' : '+ Agregar'}
        </button>
      </div>

      {showUploadForm && (
        <form 
          className="upload-form" 
          onClick={(e) => e.stopPropagation()} 
          onMouseDown={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleUpload(e)
          }}
        >
          <div className="form-group">
            <label htmlFor="tipo_documento_id">Tipo de Documento *</label>
            <select
              id="tipo_documento_id"
              value={formData.tipo_documento_id}
              onChange={(e) => setFormData(prev => ({ ...prev, tipo_documento_id: e.target.value }))}
              required
            >
              <option value="">Seleccione...</option>
              {tiposDocumentos.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="archivo-upload">Archivo *</label>
            <input
              id="archivo-upload"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              required
            />
            {formData.archivo && (
              <small className="file-info">
                Archivo seleccionado: {formData.archivo.name} ({formatFileSize(formData.archivo.size)})
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="observaciones">Observaciones</label>
            <textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              rows="3"
            />
          </div>

          <div className="form-actions-inline">
            <button 
              type="button" 
              className="btn-submit-small" 
              disabled={uploading}
              onClick={(e) => {
                e.stopPropagation()
                handleUpload(e)
              }}
            >
              {uploading ? 'Subiendo...' : 'Subir'}
            </button>
            <button
              type="button"
              className="btn-cancel-small"
              onClick={(e) => {
                e.stopPropagation()
                setShowUploadForm(false)
                setFormData({ tipo_documento_id: '', observaciones: '', archivo: null })
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="attachments-list">
        {attachments.length === 0 ? (
          <p className="empty-message">No hay documentos adjuntos</p>
        ) : (
          <table className="attachments-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Archivo</th>
                <th>Observaciones</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {attachments.map((attachment) => (
                <tr key={attachment.id}>
                  <td>{attachment.tipos_documentos?.name || '-'}</td>
                  <td>
                    <a
                      href={attachment.archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      📄 {getFileName(attachment.archivo)}
                    </a>
                  </td>
                  <td>{attachment.observaciones || '-'}</td>
                  <td>{new Date(attachment.fecha_upload).toLocaleDateString('es-ES')}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-delete-small"
                      onClick={() => handleDelete(attachment.id, attachment.archivo)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default AttachmentsSection

