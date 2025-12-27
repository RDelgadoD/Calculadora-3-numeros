/**
 * Controller para gestión de bancos (cuentas bancarias)
 */

import { BancoModel } from '../models/BancoModel.js'
import { supabaseAdmin } from '../lib/supabase.js'

export class BancoController {
  /**
   * GET /api/bancos
   * Listar bancos con paginación
   */
  static async list(req, res, next) {
    try {
      const { clienteId } = req.user
      const {
        page = 1,
        limit = 50,
        banco_nombre,
        tipo_cuenta,
        activo,
        search
      } = req.query

      const filters = { banco_nombre, tipo_cuenta, activo, search }

      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') delete filters[key]
      })

      if (filters.activo !== undefined) {
        filters.activo = filters.activo === 'true' || filters.activo === true
      }

      const result = await BancoModel.findAll({
        clienteId,
        filters,
        page: parseInt(page),
        limit: parseInt(limit)
      })

      res.json({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/bancos/search
   * Buscar cuentas bancarias por banco (para el buscador)
   */
  static async search(req, res, next) {
    try {
      const { clienteId } = req.user
      const { banco_nombre, search = '' } = req.query

      if (!banco_nombre) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El nombre del banco es requerido'
          }
        })
      }

      const cuentas = await BancoModel.searchByBanco(clienteId, banco_nombre, search)

      res.json({
        success: true,
        data: cuentas
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/bancos/:id
   * Obtener banco por ID
   */
  static async getById(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      const banco = await BancoModel.findById(id, clienteId)

      if (!banco) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Banco no encontrado'
          }
        })
      }

      res.json({
        success: true,
        data: banco
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/bancos
   * Crear banco
   */
  static async create(req, res, next) {
    try {
      const { clienteId, id: userId, email: userEmail } = req.user
      const bancoData = req.body

      // Log detallado para diagnóstico
      console.log('[BancoController.create] ==========================================')
      console.log('[BancoController.create] req.user completo:', JSON.stringify(req.user, null, 2))
      console.log('[BancoController.create] clienteId extraído:', clienteId)
      console.log('[BancoController.create] clienteId tipo:', typeof clienteId)
      console.log('[BancoController.create] clienteId es null:', clienteId === null)
      console.log('[BancoController.create] clienteId es undefined:', clienteId === undefined)
      console.log('[BancoController.create] !!clienteId:', !!clienteId)
      console.log('[BancoController.create] bancoData:', bancoData)
      console.log('[BancoController.create] ==========================================')

      // Validaciones
      if (!bancoData.banco_nombre) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El nombre del banco es obligatorio'
          }
        })
      }

      if (!bancoData.tipo_cuenta) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El tipo de cuenta es obligatorio'
          }
        })
      }

      if (!bancoData.numero_cuenta) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El número de cuenta es obligatorio'
          }
        })
      }

      // Validar que clienteId no sea null
      if (!clienteId) {
        console.error('[BancoController] Usuario sin cliente_id:', {
          userId: req.user.id,
          userEmail: req.user.email,
          rol: req.user.rol
        })
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El usuario no tiene una entidad/cliente asignado. Contacta al administrador para que te asigne un cliente.'
          }
        })
      }

      // Verificar que el cliente existe en la tabla clientes
      // IMPORTANTE: La tabla se llama "clientes" (en español)
      const { data: clienteExists, error: clienteError } = await supabaseAdmin
        .from('clientes')
        .select('id, nombre, activo')
        .eq('id', clienteId)
        .single()

      if (clienteError || !clienteExists) {
        console.error('[BancoController] Cliente no encontrado:', {
          clienteId,
          error: clienteError,
          userId: req.user.id
        })
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `El cliente asignado (ID: ${clienteId}) no existe en la base de datos. Contacta al administrador.`
          }
        })
      }

      if (!clienteExists.activo) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El cliente asignado está inactivo. Contacta al administrador.'
          }
        })
      }

      const newBanco = {
        ...bancoData,
        cliente_id: clienteId,
        activo: bancoData.activo !== undefined ? bancoData.activo : true
      }

      const banco = await BancoModel.create(newBanco)

      res.status(201).json({
        success: true,
        data: banco,
        message: 'Banco creado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/bancos/:id
   * Actualizar banco
   */
  static async update(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params
      const bancoData = req.body

      // Verificar que existe
      const existingBanco = await BancoModel.findById(id, clienteId)
      if (!existingBanco) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Banco no encontrado'
          }
        })
      }

      const updatedBanco = await BancoModel.update(id, clienteId, bancoData)

      res.json({
        success: true,
        data: updatedBanco,
        message: 'Banco actualizado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/bancos/:id
   * Eliminar banco
   */
  static async delete(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      // Verificar que existe
      const banco = await BancoModel.findById(id, clienteId)
      if (!banco) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Banco no encontrado'
          }
        })
      }

      await BancoModel.delete(id, clienteId)

      res.json({
        success: true,
        message: 'Banco eliminado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }
}
