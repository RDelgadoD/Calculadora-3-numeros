/**
 * Model para obligaciones de contratos
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class ObligationModel {
  /**
   * Obtener obligaciones de un contrato
   */
  static async findByContractId(contractId, clienteId) {
    const { data, error } = await supabaseAdmin
      .from('obligations')
      .select(`
        *,
        tipos_actividades (
          id,
          name
        ),
        productos (
          id,
          name
        ),
        estados_obligaciones (
          id,
          name
        ),
        usuarios:responsable_id (
          id,
          nombre_completo,
          email
        )
      `)
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false })

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
   * Crear obligación
   */
  static async create(obligationData) {
    const { data, error } = await supabaseAdmin
      .from('obligations')
      .insert([obligationData])
      .select(`
        *,
        tipos_actividades (
          id,
          name
        ),
        productos (
          id,
          name
        ),
        estados_obligaciones (
          id,
          name
        )
      `)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualizar obligación
   */
  static async update(id, obligationData) {
    const { data, error } = await supabaseAdmin
      .from('obligations')
      .update(obligationData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Eliminar obligación
   */
  static async delete(id) {
    const { error } = await supabaseAdmin
      .from('obligations')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}


