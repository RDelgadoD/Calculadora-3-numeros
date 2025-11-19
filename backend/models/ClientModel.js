/**
 * Model para clientes (contratantes)
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class ClientModel {
  /**
   * Obtener clientes con paginación
   */
  static async findAll({ clienteId, filters = {}, page = 1, limit = 50 }) {
    let query = supabaseAdmin
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('cliente_id', clienteId)

    // Filtros
    if (filters.tipo) {
      query = query.eq('tipo', filters.tipo)
    }

    if (filters.search) {
      query = query.or(`nombre1.ilike.%${filters.search}%,apellido1.ilike.%${filters.search}%,razon_social.ilike.%${filters.search}%,nro_identificacion.ilike.%${filters.search}%`)
    }

    query = query.order('created_at', { ascending: false })

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
   * Obtener cliente por ID
   */
  static async findById(id, clienteId) {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Crear cliente
   */
  static async create(clientData) {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .insert([clientData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualizar cliente
   */
  static async update(id, clienteId, clientData) {
    const { data, error } = await supabaseAdmin
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Eliminar cliente
   */
  static async delete(id, clienteId) {
    const { error } = await supabaseAdmin
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('cliente_id', clienteId)

    if (error) throw error
    return true
  }

  /**
   * Verificar si combinación tipo_id + nro_id ya existe
   */
  static async checkIdentificacionExists(tipoId, nroId, clienteId, excludeId = null) {
    let query = supabaseAdmin
      .from('clients')
      .select('id')
      .eq('tipo_identificacion', tipoId)
      .eq('nro_identificacion', nroId)
      .eq('cliente_id', clienteId)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) throw error
    return (data && data.length > 0)
  }
}


