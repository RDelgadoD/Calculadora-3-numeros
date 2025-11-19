/**
 * Model para operaciones con contratos
 * Capa de acceso a datos usando Supabase JS
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class ContractModel {
  /**
   * Obtener contratos con paginación y filtros
   */
  static async findAll({ clienteId, filters = {}, page = 1, limit = 10, orderBy = 'created_at', orderDir = 'desc' }) {
    let query = supabaseAdmin
      .from('contracts')
      .select(`
        *,
        clients (
          id,
          nombre1,
          nombre2,
          apellido1,
          apellido2,
          razon_social,
          tipo,
          tipo_identificacion,
          nro_identificacion
        ),
        tipos_contratos (
          id,
          name
        ),
        estados_contratos (
          id,
          name
        )
      `, { count: 'exact' })
      .eq('cliente_id', clienteId)

    // Filtros
    if (filters.numero_contrato) {
      query = query.ilike('numero_contrato', `%${filters.numero_contrato}%`)
    }

    if (filters.fecha_inicio_desde) {
      query = query.gte('fecha_inicio', filters.fecha_inicio_desde)
    }

    if (filters.fecha_inicio_hasta) {
      query = query.lte('fecha_inicio', filters.fecha_inicio_hasta)
    }

    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id)
    }

    if (filters.tipo_contrato_id) {
      query = query.eq('tipo_contrato_id', filters.tipo_contrato_id)
    }

    if (filters.estado_contrato_id) {
      query = query.eq('estado_contrato_id', filters.estado_contrato_id)
    }

    // Ordenamiento
    query = query.order(orderBy, { ascending: orderDir === 'asc' })

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  /**
   * Obtener un contrato por ID
   */
  static async findById(id, clienteId) {
    const { data, error } = await supabaseAdmin
      .from('contracts')
      .select(`
        *,
        clients (
          id,
          nombre1,
          nombre2,
          apellido1,
          apellido2,
          razon_social,
          tipo,
          tipo_identificacion,
          nro_identificacion
        ),
        tipos_contratos (
          id,
          name
        ),
        estados_contratos (
          id,
          name
        )
      `)
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Crear nuevo contrato
   */
  static async create(contractData) {
    const { data, error } = await supabaseAdmin
      .from('contracts')
      .insert([contractData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualizar contrato
   */
  static async update(id, clienteId, contractData) {
    const { data, error } = await supabaseAdmin
      .from('contracts')
      .update(contractData)
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Eliminar contrato
   */
  static async delete(id, clienteId) {
    const { error } = await supabaseAdmin
      .from('contracts')
      .delete()
      .eq('id', id)
      .eq('cliente_id', clienteId)

    if (error) throw error
    return true
  }

  /**
   * Verificar si número de contrato ya existe para el tenant
   */
  static async checkNumeroExists(numeroContrato, clienteId, excludeId = null) {
    let query = supabaseAdmin
      .from('contracts')
      .select('id')
      .eq('numero_contrato', numeroContrato)
      .eq('cliente_id', clienteId)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data && data.length > 0)
  }

  /**
   * Obtener suma de cuotas de un contrato
   */
  static async getSumInstallments(contractId) {
    const { data, error } = await supabaseAdmin
      .from('installments')
      .select('valor')
      .eq('contract_id', contractId)

    if (error) throw error

    const sum = (data || []).reduce((acc, item) => acc + parseFloat(item.valor || 0), 0)
    return sum
  }
}


