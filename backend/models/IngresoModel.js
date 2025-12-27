/**
 * Model para ingresos
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class IngresoModel {
  /**
   * Obtener ingresos con paginación
   */
  static async findAll({ clienteId, filters = {}, page = 1, limit = 50 }) {
    // Obtener ingresos básicos primero
    let query = supabaseAdmin
      .from('ingresos')
      .select('*', { count: 'exact' })
      .eq('cliente_id', clienteId)

    // Filtros
    if (filters.fecha_inicio) {
      query = query.gte('fecha_ingreso', filters.fecha_inicio)
    }

    if (filters.fecha_fin) {
      query = query.lte('fecha_ingreso', filters.fecha_fin)
    }

    if (filters.search) {
      query = query.or(`valor_ingreso::text.ilike.%${filters.search}%`)
    }

    query = query.order('fecha_ingreso', { ascending: false })

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    // Cargar relaciones para cada ingreso
    const ingresosConRelaciones = await Promise.all(
      (data || []).map(async (ingreso) => {
        // Cargar concepto de ingreso
        if (ingreso.concepto_ingreso_id) {
          const { data: concepto } = await supabaseAdmin
            .from('conceptos_ingreso')
            .select('id, nombre, descripcion')
            .eq('id', ingreso.concepto_ingreso_id)
            .single()
          ingreso.concepto_ingreso = concepto?.nombre || null
          ingreso.concepto_ingreso_obj = concepto || null
        }

        // Cargar cuenta bancaria y banco
        if (ingreso.cuenta_bancaria_id) {
          const { data: banco } = await supabaseAdmin
            .from('bancos')
            .select('*')
            .eq('id', ingreso.cuenta_bancaria_id)
            .single()
          ingreso.cuenta_bancaria = banco || null
          ingreso.banco = banco?.banco_nombre || null
        }

        // Cargar contrato
        if (ingreso.contrato_id) {
          const { data: contrato } = await supabaseAdmin
            .from('contracts')
            .select('id, numero_contrato, cliente_id')
            .eq('id', ingreso.contrato_id)
            .single()
          
          if (contrato && contrato.cliente_id) {
            const { data: cliente } = await supabaseAdmin
              .from('clients')
              .select('*')
              .eq('id', contrato.cliente_id)
              .single()
            contrato.cliente = cliente || null
          }
          
          ingreso.contrato = contrato || null
        }

        return ingreso
      })
    )

    return {
      data: ingresosConRelaciones,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }

  /**
   * Obtener ingreso por ID
   */
  static async findById(id, clienteId) {
    // Obtener ingreso sin relaciones para evitar errores de schema cache
    const { data, error } = await supabaseAdmin
      .from('ingresos')
      .select('*')
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .single()

    if (error) throw error
    
    // Cargar concepto de ingreso
    if (data.concepto_ingreso_id) {
      const { data: concepto } = await supabaseAdmin
        .from('conceptos_ingreso')
        .select('id, nombre, descripcion')
        .eq('id', data.concepto_ingreso_id)
        .single()
      data.concepto_ingreso = concepto?.nombre || null
      data.concepto_ingreso_obj = concepto || null
    }
    
    // Obtener cuenta bancaria y banco
    if (data.cuenta_bancaria_id) {
      const { data: banco } = await supabaseAdmin
        .from('bancos')
        .select('*')
        .eq('id', data.cuenta_bancaria_id)
        .single()
      data.cuenta_bancaria = banco || null
      data.banco = banco?.banco_nombre || null
    }
    
    // Cargar contrato
    if (data.contrato_id) {
      const { data: contrato } = await supabaseAdmin
        .from('contracts')
        .select('id, numero_contrato, cliente_id')
        .eq('id', data.contrato_id)
        .single()
      
      if (contrato && contrato.cliente_id) {
        const { data: cliente } = await supabaseAdmin
          .from('clients')
          .select('*')
          .eq('id', contrato.cliente_id)
          .single()
        contrato.cliente = cliente || null
      }
      
      data.contrato = contrato || null
    }
    
    return data
  }

  /**
   * Crear ingreso
   */
  static async create(ingresoData) {
    // Insertar sin relaciones para evitar errores de schema cache
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('ingresos')
      .insert([ingresoData])
      .select()
      .single()

    if (insertError) throw insertError
    
    // Obtener el ingreso con relaciones usando una consulta separada
    return await this.findById(insertedData.id, insertedData.cliente_id)
  }

  /**
   * Actualizar ingreso
   */
  static async update(id, clienteId, ingresoData) {
    // Actualizar sin relaciones para evitar errores de schema cache
    const { error: updateError } = await supabaseAdmin
      .from('ingresos')
      .update(ingresoData)
      .eq('id', id)
      .eq('cliente_id', clienteId)

    if (updateError) throw updateError
    
    // Obtener el ingreso actualizado con relaciones usando una consulta separada
    return await this.findById(id, clienteId)
  }

  /**
   * Eliminar ingreso
   */
  static async delete(id, clienteId) {
    const { error } = await supabaseAdmin
      .from('ingresos')
      .delete()
      .eq('id', id)
      .eq('cliente_id', clienteId)

    if (error) throw error
  }
}
