/**
 * Controller para gestión de ingresos
 */

import { IngresoModel } from '../models/IngresoModel.js'
import { supabaseAdmin } from '../lib/supabase.js'

export class IngresoController {
  /**
   * GET /api/ingresos
   * Listar ingresos con paginación
   */
  static async list(req, res, next) {
    try {
      const { clienteId } = req.user
      const {
        page = 1,
        limit = 50,
        concepto_ingreso,
        banco,
        fecha_inicio,
        fecha_fin,
        search
      } = req.query

      // Solo pasar filtros que existen en la tabla directamente
      const filters = { fecha_inicio, fecha_fin, search }

      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') delete filters[key]
      })

      const result = await IngresoModel.findAll({
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
   * GET /api/ingresos/:id
   * Obtener ingreso por ID
   */
  static async getById(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      const ingreso = await IngresoModel.findById(id, clienteId)

      if (!ingreso) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Ingreso no encontrado'
          }
        })
      }

      res.json({
        success: true,
        data: ingreso
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/ingresos
   * Crear ingreso
   */
  static async create(req, res, next) {
    try {
      const { clienteId } = req.user
      const ingresoData = req.body

      // Validaciones
      if (!ingresoData.fecha_ingreso) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'La fecha del ingreso es obligatoria'
          }
        })
      }

      if (!ingresoData.concepto_ingreso) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El concepto del ingreso es obligatorio'
          }
        })
      }

      if (!ingresoData.cuenta_bancaria_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'La cuenta bancaria es obligatoria'
          }
        })
      }

      if (!ingresoData.valor_ingreso || ingresoData.valor_ingreso <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El valor del ingreso debe ser mayor a cero'
          }
        })
      }

      // Si el concepto es "Pago contrato", el contrato_id es obligatorio
      if (ingresoData.concepto_ingreso === 'Pago contrato' && !ingresoData.contrato_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El contrato es obligatorio cuando el concepto es "Pago contrato"'
          }
        })
      }

      // Si el concepto NO es "Pago contrato", el contrato_id debe ser null
      if (ingresoData.concepto_ingreso !== 'Pago contrato') {
        ingresoData.contrato_id = null
      }

      // Convertir concepto_ingreso (string) a concepto_ingreso_id (UUID)
      let conceptoIngresoId = ingresoData.concepto_ingreso_id
      if (!conceptoIngresoId && ingresoData.concepto_ingreso) {
        const { data: concepto } = await supabaseAdmin
          .from('conceptos_ingreso')
          .select('id')
          .eq('nombre', ingresoData.concepto_ingreso)
          .single()
        
        if (!concepto) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `El concepto de ingreso "${ingresoData.concepto_ingreso}" no existe`
            }
          })
        }
        conceptoIngresoId = concepto.id
      }

      // Preparar datos para insertar - solo campos que existen en la tabla
      const newIngreso = {
        fecha_ingreso: ingresoData.fecha_ingreso,
        concepto_ingreso_id: conceptoIngresoId,
        cuenta_bancaria_id: ingresoData.cuenta_bancaria_id || null,
        valor_ingreso: ingresoData.valor_ingreso,
        contrato_id: ingresoData.contrato_id || null,
        cliente_id: clienteId,
        observaciones: ingresoData.observaciones || null
      }

      const ingreso = await IngresoModel.create(newIngreso)

      res.status(201).json({
        success: true,
        data: ingreso,
        message: 'Ingreso creado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/ingresos/:id
   * Actualizar ingreso
   */
  static async update(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params
      const ingresoData = req.body

      // Verificar que existe
      const existingIngreso = await IngresoModel.findById(id, clienteId)
      if (!existingIngreso) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Ingreso no encontrado'
          }
        })
      }

      // Validar valor
      if (ingresoData.valor_ingreso !== undefined && ingresoData.valor_ingreso <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El valor del ingreso debe ser mayor a cero'
          }
        })
      }

      // Si el concepto es "Pago contrato", el contrato_id es obligatorio
      if (ingresoData.concepto_ingreso === 'Pago contrato' && !ingresoData.contrato_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El contrato es obligatorio cuando el concepto es "Pago contrato"'
          }
        })
      }

      // Si el concepto NO es "Pago contrato", el contrato_id debe ser null
      if (ingresoData.concepto_ingreso !== 'Pago contrato') {
        ingresoData.contrato_id = null
      }

      // Convertir concepto_ingreso (string) a concepto_ingreso_id (UUID)
      let conceptoIngresoId = ingresoData.concepto_ingreso_id
      if (!conceptoIngresoId && ingresoData.concepto_ingreso) {
        const { data: concepto } = await supabaseAdmin
          .from('conceptos_ingreso')
          .select('id')
          .eq('nombre', ingresoData.concepto_ingreso)
          .single()
        
        if (!concepto) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `El concepto de ingreso "${ingresoData.concepto_ingreso}" no existe`
            }
          })
        }
        conceptoIngresoId = concepto.id
      }

      // Preparar datos para actualizar - solo campos que existen en la tabla
      // NO incluir 'banco' porque no existe esa columna, solo cuenta_bancaria_id
      const updateData = {
        fecha_ingreso: ingresoData.fecha_ingreso,
        concepto_ingreso_id: conceptoIngresoId,
        cuenta_bancaria_id: ingresoData.cuenta_bancaria_id || null,
        valor_ingreso: ingresoData.valor_ingreso,
        contrato_id: ingresoData.contrato_id || null,
        observaciones: ingresoData.observaciones || null
      }

      const updatedIngreso = await IngresoModel.update(id, clienteId, updateData)

      res.json({
        success: true,
        data: updatedIngreso,
        message: 'Ingreso actualizado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/ingresos/:id
   * Eliminar ingreso
   */
  static async delete(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      // Verificar que existe
      const ingreso = await IngresoModel.findById(id, clienteId)
      if (!ingreso) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Ingreso no encontrado'
          }
        })
      }

      await IngresoModel.delete(id, clienteId)

      res.json({
        success: true,
        message: 'Ingreso eliminado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }
}
