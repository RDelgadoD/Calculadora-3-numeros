/**
 * Controller para gestión de conceptos de ingreso
 */

import { ConceptoIngresoModel } from '../models/ConceptoIngresoModel.js'

export class ConceptoIngresoController {
  /**
   * GET /api/conceptos-ingreso
   * Listar conceptos con paginación
   */
  static async list(req, res, next) {
    try {
      const { clienteId } = req.user
      const {
        page = 1,
        limit = 50,
        activo,
        search
      } = req.query

      const filters = { activo, search }

      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === '') delete filters[key]
      })

      if (filters.activo !== undefined) {
        filters.activo = filters.activo === 'true' || filters.activo === true
      }

      const result = await ConceptoIngresoModel.findAll({
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
   * GET /api/conceptos-ingreso/:id
   * Obtener concepto por ID
   */
  static async getById(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      const concepto = await ConceptoIngresoModel.findById(id, clienteId)

      if (!concepto) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Concepto no encontrado'
          }
        })
      }

      res.json({
        success: true,
        data: concepto
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/conceptos-ingreso
   * Crear concepto
   */
  static async create(req, res, next) {
    try {
      const { clienteId } = req.user
      const conceptoData = req.body

      // Validaciones
      if (!conceptoData.nombre) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El nombre del concepto es obligatorio'
          }
        })
      }

      // Los conceptos de ingreso son globales, no tienen cliente_id
      const newConcepto = {
        nombre: conceptoData.nombre,
        descripcion: conceptoData.descripcion || null,
        activo: conceptoData.activo !== undefined ? conceptoData.activo : true
      }

      const concepto = await ConceptoIngresoModel.create(newConcepto)

      res.status(201).json({
        success: true,
        data: concepto,
        message: 'Concepto creado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/conceptos-ingreso/:id
   * Actualizar concepto
   */
  static async update(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params
      const conceptoData = req.body

      // Verificar que existe
      const existingConcepto = await ConceptoIngresoModel.findById(id, clienteId)
      if (!existingConcepto) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Concepto no encontrado'
          }
        })
      }

      const updatedConcepto = await ConceptoIngresoModel.update(id, clienteId, conceptoData)

      res.json({
        success: true,
        data: updatedConcepto,
        message: 'Concepto actualizado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/conceptos-ingreso/:id
   * Eliminar concepto
   */
  static async delete(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      // Verificar que existe
      const concepto = await ConceptoIngresoModel.findById(id, clienteId)
      if (!concepto) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Concepto no encontrado'
          }
        })
      }

      await ConceptoIngresoModel.delete(id, clienteId)

      res.json({
        success: true,
        message: 'Concepto eliminado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }
}
