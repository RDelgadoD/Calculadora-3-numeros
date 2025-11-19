/**
 * Model para cuotas de pago de contratos
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class InstallmentModel {
  /**
   * Obtener cuotas de un contrato
   */
  static async findByContractId(contractId, clienteId) {
    const { data, error } = await supabaseAdmin
      .from('installments')
      .select(`
        *,
        estados_pagos (
          id,
          name
        )
      `)
      .eq('contract_id', contractId)
      .order('fecha_cobro', { ascending: true })

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
   * Crear cuota
   */
  static async create(installmentData) {
    const { data, error } = await supabaseAdmin
      .from('installments')
      .insert([installmentData])
      .select(`
        *,
        estados_pagos (
          id,
          name
        )
      `)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualizar cuota
   */
  static async update(id, installmentData) {
    const { data, error } = await supabaseAdmin
      .from('installments')
      .update(installmentData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Eliminar cuota
   */
  static async delete(id) {
    const { error } = await supabaseAdmin
      .from('installments')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }

  /**
   * Obtener cuota por ID
   */
  static async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('installments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Obtener suma de valores de cuotas de un contrato
   */
  static async getSumByContractId(contractId) {
    const { data, error } = await supabaseAdmin
      .from('installments')
      .select('valor')
      .eq('contract_id', contractId)

    if (error) throw error

    const sum = (data || []).reduce((acc, item) => acc + parseFloat(item.valor || 0), 0)
    return sum
  }
}


