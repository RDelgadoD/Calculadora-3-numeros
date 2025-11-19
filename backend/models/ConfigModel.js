/**
 * Model para tablas configurables (enums)
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class ConfigModel {
  /**
   * Obtener tipos de contratos
   */
  static async getTiposContratos(clienteId = null) {
    let query = supabaseAdmin
      .from('tipos_contratos')
      .select('*')
      .order('name')

    if (clienteId) {
      query = query.or(`cliente_id.is.null,cliente_id.eq.${clienteId}`)
    } else {
      query = query.is('cliente_id', null)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Obtener estados de contratos
   */
  static async getEstadosContratos(clienteId = null) {
    let query = supabaseAdmin
      .from('estados_contratos')
      .select('*')
      .order('name')

    if (clienteId) {
      query = query.or(`cliente_id.is.null,cliente_id.eq.${clienteId}`)
    } else {
      query = query.is('cliente_id', null)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Obtener tipos de documentos
   */
  static async getTiposDocumentos(clienteId = null) {
    let query = supabaseAdmin
      .from('tipos_documentos')
      .select('*')
      .order('name')

    if (clienteId) {
      query = query.or(`cliente_id.is.null,cliente_id.eq.${clienteId}`)
    } else {
      query = query.is('cliente_id', null)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Obtener estados de pagos
   */
  static async getEstadosPagos(clienteId = null) {
    let query = supabaseAdmin
      .from('estados_pagos')
      .select('*')
      .order('name')

    if (clienteId) {
      query = query.or(`cliente_id.is.null,cliente_id.eq.${clienteId}`)
    } else {
      query = query.is('cliente_id', null)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Obtener tipos de actividades
   */
  static async getTiposActividades(clienteId = null) {
    let query = supabaseAdmin
      .from('tipos_actividades')
      .select('*')
      .order('name')

    if (clienteId) {
      query = query.or(`cliente_id.is.null,cliente_id.eq.${clienteId}`)
    } else {
      query = query.is('cliente_id', null)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Obtener productos
   */
  static async getProductos(clienteId = null) {
    let query = supabaseAdmin
      .from('productos')
      .select('*')
      .order('name')

    if (clienteId) {
      query = query.or(`cliente_id.is.null,cliente_id.eq.${clienteId}`)
    } else {
      query = query.is('cliente_id', null)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Obtener estados de obligaciones
   */
  static async getEstadosObligaciones(clienteId = null) {
    let query = supabaseAdmin
      .from('estados_obligaciones')
      .select('*')
      .order('name')

    if (clienteId) {
      query = query.or(`cliente_id.is.null,cliente_id.eq.${clienteId}`)
    } else {
      query = query.is('cliente_id', null)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  /**
   * Obtener tipos de identificación
   */
  static async getTiposIdentificacion(clienteId = null) {
    let query = supabaseAdmin
      .from('tipos_identificacion')
      .select('*')
      .order('name')

    if (clienteId) {
      query = query.or(`cliente_id.is.null,cliente_id.eq.${clienteId}`)
    } else {
      query = query.is('cliente_id', null)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }
}


