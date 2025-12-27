/**
 * Controller para operaciones de configuración inicial
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class SetupController {
  /**
   * POST /api/setup/assign-default-cliente
   * Asignar cliente por defecto a usuarios sin cliente
   */
  static async assignDefaultCliente(req, res, next) {
    try {
      // 1. Verificar si existe un cliente por defecto
      let { data: clienteDefault, error: clienteError } = await supabaseAdmin
        .from('clientes')
        .select('id, nombre')
        .eq('nombre', 'OT Piendamo Cauca')
        .limit(1)
        .single()

      // 2. Si no existe, crearlo
      if (clienteError || !clienteDefault) {
        const { data: nuevoCliente, error: createError } = await supabaseAdmin
          .from('clientes')
          .insert([
            {
              nombre: 'OT Piendamo Cauca',
              activo: true
            }
          ])
          .select()
          .single()

        if (createError) {
          throw createError
        }

        clienteDefault = nuevoCliente
      }

      // 3. Obtener usuarios sin cliente
      const { data: usuariosSinCliente, error: usuariosError } = await supabaseAdmin
        .from('usuarios')
        .select('id, email, nombre_completo, cliente_id')
        .is('cliente_id', null)

      if (usuariosError) {
        throw usuariosError
      }

      // 4. Asignar el cliente a los usuarios sin cliente
      let usuariosActualizados = 0
      if (usuariosSinCliente && usuariosSinCliente.length > 0) {
        const { error: updateError } = await supabaseAdmin
          .from('usuarios')
          .update({ cliente_id: clienteDefault.id })
          .is('cliente_id', null)
          .eq('activo', true)

        if (updateError) {
          throw updateError
        }

        usuariosActualizados = usuariosSinCliente.length
      }

      // 5. Verificar resultado final
      const { data: usuariosFinales, error: finalError } = await supabaseAdmin
        .from('usuarios')
        .select(`
          id,
          email,
          nombre_completo,
          cliente_id,
          clientes (
            id,
            nombre
          )
        `)
        .order('created_at', { ascending: false })

      if (finalError) {
        throw finalError
      }

      res.json({
        success: true,
        message: `Cliente asignado exitosamente. ${usuariosActualizados} usuarios actualizados.`,
        data: {
          cliente: clienteDefault,
          usuariosActualizados,
          usuarios: usuariosFinales
        }
      })
    } catch (error) {
      console.error('[SetupController] Error al asignar cliente por defecto:', error)
      next(error)
    }
  }

  /**
   * GET /api/setup/status
   * Verificar estado de la configuración
   */
  static async getStatus(req, res, next) {
    try {
      // Contar clientes
      const { count: clientesCount, error: clientesError } = await supabaseAdmin
        .from('clientes')
        .select('*', { count: 'exact', head: true })

      // Contar usuarios sin cliente
      const { count: usuariosSinClienteCount, error: usuariosError } = await supabaseAdmin
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .is('cliente_id', null)

      // Obtener lista de clientes
      const { data: clientes, error: clientesListError } = await supabaseAdmin
        .from('clientes')
        .select('id, nombre, activo')
        .order('created_at', { ascending: false })

      if (clientesError || usuariosError || clientesListError) {
        throw clientesError || usuariosError || clientesListError
      }

      res.json({
        success: true,
        data: {
          clientes: {
            total: clientesCount || 0,
            lista: clientes || []
          },
          usuarios: {
            sinCliente: usuariosSinClienteCount || 0
          }
        }
      })
    } catch (error) {
      console.error('[SetupController] Error al obtener estado:', error)
      next(error)
    }
  }
}

