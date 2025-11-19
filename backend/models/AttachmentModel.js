/**
 * Model para documentos adjuntos de contratos
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class AttachmentModel {
  /**
   * Obtener adjuntos de un contrato
   */
  static async findByContractId(contractId, clienteId) {
    const { data, error } = await supabaseAdmin
      .from('attachments')
      .select(`
        *,
        tipos_documentos (
          id,
          name
        ),
        usuarios:usuario_upload (
          id,
          nombre_completo,
          email
        )
      `)
      .eq('contract_id', contractId)
      .order('fecha_upload', { ascending: false })

    if (error) throw error

    // Verificar que el contrato pertenece al cliente
    const { data: contract } = await supabaseAdmin
      .from('contracts')
      .select('cliente_id')
      .eq('id', contractId)
      .single()

    if (!contract || contract.cliente_id !== clienteId) {
      throw new Error('Contrato no encontrado o sin permisos')
    }

    return data || []
  }

  /**
   * Crear adjunto
   */
  static async create(attachmentData) {
    const { data, error } = await supabaseAdmin
      .from('attachments')
      .insert([attachmentData])
      .select(`
        *,
        tipos_documentos (
          id,
          name
        )
      `)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualizar adjunto
   */
  static async update(id, attachmentData) {
    const { data, error } = await supabaseAdmin
      .from('attachments')
      .update(attachmentData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Eliminar adjunto
   */
  static async delete(id) {
    const { error } = await supabaseAdmin
      .from('attachments')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  /**
   * Obtener adjunto por ID
   */
  static async findById(id, clienteId) {
    const { data, error } = await supabaseAdmin
      .from('attachments')
      .select(`
        *,
        contracts!inner (
          cliente_id
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    if (data.contracts.cliente_id !== clienteId) {
      throw new Error('Sin permisos para acceder a este adjunto')
    }

    return data
  }
}


