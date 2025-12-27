/**
 * Model para bancos (cuentas bancarias)
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class BancoModel {
  /**
   * Obtener bancos con paginación
   */
  static async findAll({ clienteId, filters = {}, page = 1, limit = 50 }) {
    let query = supabaseAdmin
      .from('bancos')
      .select('*', { count: 'exact' })
      .eq('cliente_id', clienteId)

    // Filtros
    if (filters.banco_nombre) {
      query = query.eq('banco_nombre', filters.banco_nombre)
    }

    if (filters.tipo_cuenta) {
      query = query.eq('tipo_cuenta', filters.tipo_cuenta)
    }

    if (filters.activo !== undefined) {
      query = query.eq('activo', filters.activo)
    }

    if (filters.search) {
      query = query.or(`numero_cuenta.ilike.%${filters.search}%,banco_nombre.ilike.%${filters.search}%`)
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
   * Obtener banco por ID
   */
  static async findById(id, clienteId) {
    const { data, error } = await supabaseAdmin
      .from('bancos')
      .select('*')
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Buscar cuentas bancarias por banco (para el buscador)
   */
  static async searchByBanco(clienteId, bancoNombre, search = '') {
    let query = supabaseAdmin
      .from('bancos')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('banco_nombre', bancoNombre)
      .eq('activo', true)

    if (search) {
      query = query.or(`numero_cuenta.ilike.%${search}%,tipo_cuenta.ilike.%${search}%`)
    }

    query = query.order('tipo_cuenta', { ascending: true })
      .order('numero_cuenta', { ascending: true })

    const { data, error } = await query

    if (error) throw error

    // Formatear para el buscador: "Tipo - Número"
    return (data || []).map(banco => ({
      ...banco,
      displayText: `${banco.tipo_cuenta} - ${banco.numero_cuenta}`
    }))
  }

  /**
   * Crear banco
   */
  static async create(bancoData) {
    const { data, error } = await supabaseAdmin
      .from('bancos')
      .insert([bancoData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualizar banco
   */
  static async update(id, clienteId, bancoData) {
    const { data, error } = await supabaseAdmin
      .from('bancos')
      .update(bancoData)
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Eliminar banco
   */
  static async delete(id, clienteId) {
    const { error } = await supabaseAdmin
      .from('bancos')
      .delete()
      .eq('id', id)
      .eq('cliente_id', clienteId)

    if (error) throw error
  }
}

