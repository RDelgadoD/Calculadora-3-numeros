/**
 * Model para conceptos de ingreso
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class ConceptoIngresoModel {
  /**
   * Obtener conceptos con paginación
   */
  static async findAll({ clienteId, filters = {}, page = 1, limit = 50 }) {
    // Los conceptos de ingreso son globales, no específicos por cliente
    // No filtramos por cliente_id porque esa columna no existe en la tabla
    let query = supabaseAdmin
      .from('conceptos_ingreso')
      .select('*', { count: 'exact' })

    // Filtros
    if (filters.activo !== undefined) {
      query = query.eq('activo', filters.activo)
    }

    if (filters.search) {
      query = query.or(`nombre.ilike.%${filters.search}%,descripcion.ilike.%${filters.search}%`)
    }

    query = query.order('nombre', { ascending: true })

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
   * Obtener concepto por ID
   */
  static async findById(id, clienteId) {
    // Los conceptos de ingreso son globales, no específicos por cliente
    // No filtramos por cliente_id porque esa columna no existe en la tabla
    const { data, error } = await supabaseAdmin
      .from('conceptos_ingreso')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Crear concepto
   */
  static async create(conceptoData) {
    const { data, error } = await supabaseAdmin
      .from('conceptos_ingreso')
      .insert([conceptoData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualizar concepto
   */
  static async update(id, clienteId, conceptoData) {
    // Los conceptos de ingreso son globales, no específicos por cliente
    // No filtramos por cliente_id porque esa columna no existe en la tabla
    const { data, error } = await supabaseAdmin
      .from('conceptos_ingreso')
      .update(conceptoData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Eliminar concepto
   */
  static async delete(id, clienteId) {
    // Los conceptos de ingreso son globales, no específicos por cliente
    // No filtramos por cliente_id porque esa columna no existe en la tabla
    const { error } = await supabaseAdmin
      .from('conceptos_ingreso')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
