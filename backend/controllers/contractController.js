/**
 * Controller para gestión de contratos
 * Lógica de negocio y validaciones
 */

import { ContractModel } from '../models/ContractModel.js'
import { AttachmentModel } from '../models/AttachmentModel.js'
import { InstallmentModel } from '../models/InstallmentModel.js'
import { ObligationModel } from '../models/ObligationModel.js'

export class ContractController {
  /**
   * GET /api/contracts
   * Listar contratos con paginación y filtros
   */
  static async list(req, res, next) {
    try {
      const { clienteId } = req.user
      const {
        page = 1,
        limit = 10,
        numero_contrato,
        fecha_inicio_desde,
        fecha_inicio_hasta,
        client_id,
        tipo_contrato_id,
        estado_contrato_id,
        orderBy = 'created_at',
        orderDir = 'desc'
      } = req.query

      const filters = {
        numero_contrato,
        fecha_inicio_desde,
        fecha_inicio_hasta,
        client_id,
        tipo_contrato_id,
        estado_contrato_id
      }

      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key]
      })

      const result = await ContractModel.findAll({
        clienteId,
        filters,
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy,
        orderDir
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
   * GET /api/contracts/:id
   * Obtener un contrato por ID
   */
  static async getById(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      const contract = await ContractModel.findById(id, clienteId)

      if (!contract) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contrato no encontrado'
          }
        })
      }

      res.json({
        success: true,
        data: contract
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/contracts
   * Crear nuevo contrato
   */
  static async create(req, res, next) {
    try {
      const { clienteId, id: userId } = req.user
      const contractData = req.body

      // Validaciones
      if (!contractData.numero_contrato) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El número de contrato es obligatorio'
          }
        })
      }

      if (!contractData.fecha_inicio) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'La fecha de inicio es obligatoria'
          }
        })
      }

      if (!contractData.client_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El contratante es obligatorio'
          }
        })
      }

      if (!contractData.valor_contrato || parseFloat(contractData.valor_contrato) <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El valor del contrato es obligatorio y debe ser mayor a 0'
          }
        })
      }

      if (!contractData.objeto_contrato) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El objeto del contrato es obligatorio'
          }
        })
      }

      // Verificar que número de contrato no exista
      const numeroExists = await ContractModel.checkNumeroExists(
        contractData.numero_contrato,
        clienteId
      )

      if (numeroExists) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'El número de contrato ya existe para este tenant'
          }
        })
      }

      // Preparar datos: convertir fechas vacías a null
      const newContract = {
        ...contractData,
        cliente_id: clienteId,
        created_by: userId,
        // Convertir cadenas vacías de fechas opcionales a null
        fecha_terminacion: contractData.fecha_terminacion?.trim() || null,
        fecha_liquidacion: contractData.fecha_liquidacion?.trim() || null
      }

      const contract = await ContractModel.create(newContract)

      res.status(201).json({
        success: true,
        data: contract,
        message: 'Contrato creado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/contracts/:id
   * Actualizar contrato
   */
  static async update(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params
      const contractData = req.body

      // Verificar que el contrato existe
      const existingContract = await ContractModel.findById(id, clienteId)
      if (!existingContract) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contrato no encontrado'
          }
        })
      }

      // Si se actualiza el número, verificar que no exista
      if (contractData.numero_contrato && contractData.numero_contrato !== existingContract.numero_contrato) {
        const numeroExists = await ContractModel.checkNumeroExists(
          contractData.numero_contrato,
          clienteId,
          id
        )

        if (numeroExists) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'DUPLICATE_ENTRY',
              message: 'El número de contrato ya existe para este tenant'
            }
          })
        }
      }

      // Preparar datos: convertir fechas vacías a null
      const updateData = {
        ...contractData,
        // Convertir cadenas vacías de fechas opcionales a null
        fecha_terminacion: contractData.fecha_terminacion?.trim() || null,
        fecha_liquidacion: contractData.fecha_liquidacion?.trim() || null
      }

      const updatedContract = await ContractModel.update(id, clienteId, updateData)

      res.json({
        success: true,
        data: updatedContract,
        message: 'Contrato actualizado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/contracts/:id
   * Eliminar contrato
   */
  static async delete(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      // Verificar que existe
      const contract = await ContractModel.findById(id, clienteId)
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contrato no encontrado'
          }
        })
      }

      await ContractModel.delete(id, clienteId)

      res.json({
        success: true,
        message: 'Contrato eliminado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/contracts/:id/attachments
   * Obtener adjuntos de un contrato
   */
  static async getAttachments(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      const attachments = await AttachmentModel.findByContractId(id, clienteId)

      res.json({
        success: true,
        data: attachments
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/contracts/:id/attachments
   * Crear adjunto
   */
  static async createAttachment(req, res, next) {
    try {
      const { clienteId, id: userId } = req.user
      const { id: contractId } = req.params
      const attachmentData = req.body

      // Validaciones
      if (!attachmentData.tipo_documento_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El tipo de documento es obligatorio'
          }
        })
      }

      // Verificar que el contrato existe y pertenece al tenant
      const contract = await ContractModel.findById(contractId, clienteId)
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contrato no encontrado'
          }
        })
      }

      const newAttachment = {
        ...attachmentData,
        contract_id: contractId,
        usuario_upload: userId
      }

      const attachment = await AttachmentModel.create(newAttachment)

      res.status(201).json({
        success: true,
        data: attachment,
        message: 'Adjunto creado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/contracts/:id/attachments/:attachmentId
   * Eliminar adjunto
   */
  static async deleteAttachment(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id: contractId, attachmentId } = req.params

      // Verificar que el contrato existe
      const contract = await ContractModel.findById(contractId, clienteId)
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contrato no encontrado'
          }
        })
      }

      await AttachmentModel.delete(attachmentId)

      res.json({
        success: true,
        message: 'Adjunto eliminado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/contracts/:id/installments
   * Obtener cuotas de un contrato
   */
  static async getInstallments(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      const installments = await InstallmentModel.findByContractId(id, clienteId)

      res.json({
        success: true,
        data: installments
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/contracts/:id/installments
   * Crear cuota
   */
  static async createInstallment(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id: contractId } = req.params
      const installmentData = req.body

      // Validaciones
      if (!installmentData.nombre_pago) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El nombre del pago es obligatorio'
          }
        })
      }

      if (!installmentData.valor || parseFloat(installmentData.valor) <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El valor es obligatorio y debe ser mayor a 0'
          }
        })
      }

      // Verificar que el contrato existe
      const contract = await ContractModel.findById(contractId, clienteId)
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contrato no encontrado'
          }
        })
      }

      // Obtener suma actual de cuotas
      const currentSum = await InstallmentModel.getSumByContractId(contractId)
      const newValue = parseFloat(installmentData.valor)
      const totalSum = currentSum + newValue

      // Validar que la suma no exceda el valor del contrato
      if (totalSum > parseFloat(contract.valor_contrato)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `La suma de las cuotas (${totalSum.toFixed(2)}) excede el valor del contrato (${contract.valor_contrato})`
          }
        })
      }

      // Preparar datos: convertir fecha vacía a null
      const newInstallment = {
        ...installmentData,
        contract_id: contractId,
        // Convertir fecha_cobro vacía a null (opcional)
        fecha_cobro: installmentData.fecha_cobro?.trim() || null
      }

      const installment = await InstallmentModel.create(newInstallment)

      res.status(201).json({
        success: true,
        data: installment,
        message: 'Cuota creada exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/contracts/:id/installments/:installmentId
   * Actualizar cuota
   */
  static async updateInstallment(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id: contractId, installmentId } = req.params
      const installmentData = req.body

      // Validaciones
      if (installmentData.valor && parseFloat(installmentData.valor) <= 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El valor debe ser mayor a 0'
          }
        })
      }

      // Verificar que el contrato existe
      const contract = await ContractModel.findById(contractId, clienteId)
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contrato no encontrado'
          }
        })
      }

      // Si se actualiza el valor, validar suma
      if (installmentData.valor) {
        const currentSum = await InstallmentModel.getSumByContractId(contractId)
        const existingInstallment = await InstallmentModel.findById(installmentId)
        const oldValue = parseFloat(existingInstallment?.valor || 0)
        const newValue = parseFloat(installmentData.valor)
        const totalSum = currentSum - oldValue + newValue

        if (totalSum > parseFloat(contract.valor_contrato)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `La suma de las cuotas (${totalSum.toFixed(2)}) excede el valor del contrato (${contract.valor_contrato})`
            }
          })
        }
      }

      // Preparar datos: convertir fecha vacía a null
      const updateData = {
        ...installmentData,
        // Convertir fecha_cobro vacía a null si se está actualizando (opcional)
        fecha_cobro: installmentData.fecha_cobro !== undefined 
          ? (installmentData.fecha_cobro?.trim() || null)
          : undefined
      }

      const updatedInstallment = await InstallmentModel.update(installmentId, updateData)

      res.json({
        success: true,
        data: updatedInstallment,
        message: 'Cuota actualizada exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/contracts/:id/installments/:installmentId
   * Eliminar cuota
   */
  static async deleteInstallment(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id: contractId, installmentId } = req.params

      // Verificar que el contrato existe
      const contract = await ContractModel.findById(contractId, clienteId)
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contrato no encontrado'
          }
        })
      }

      await InstallmentModel.delete(installmentId)

      res.json({
        success: true,
        message: 'Cuota eliminada exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/contracts/:id/obligations
   * Obtener obligaciones de un contrato
   */
  static async getObligations(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      const obligations = await ObligationModel.findByContractId(id, clienteId)

      res.json({
        success: true,
        data: obligations
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/contracts/:id/obligations
   * Crear obligación
   */
  static async createObligation(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id: contractId } = req.params
      const obligationData = req.body

      // Validaciones
      if (!obligationData.tipo_actividad_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El tipo de actividad es obligatorio'
          }
        })
      }

      if (!obligationData.producto_id) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El producto es obligatorio'
          }
        })
      }

      // Verificar que el contrato existe
      const contract = await ContractModel.findById(contractId, clienteId)
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contrato no encontrado'
          }
        })
      }

      const newObligation = {
        ...obligationData,
        contract_id: contractId
      }

      const obligation = await ObligationModel.create(newObligation)

      res.status(201).json({
        success: true,
        data: obligation,
        message: 'Obligación creada exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/contracts/:id/obligations/:obligationId
   * Actualizar obligación
   */
  static async updateObligation(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id: contractId, obligationId } = req.params
      const obligationData = req.body

      // Verificar que el contrato existe
      const contract = await ContractModel.findById(contractId, clienteId)
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contrato no encontrado'
          }
        })
      }

      const updatedObligation = await ObligationModel.update(obligationId, obligationData)

      res.json({
        success: true,
        data: updatedObligation,
        message: 'Obligación actualizada exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/contracts/:id/obligations/:obligationId
   * Eliminar obligación
   */
  static async deleteObligation(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id: contractId, obligationId } = req.params

      // Verificar que el contrato existe
      const contract = await ContractModel.findById(contractId, clienteId)
      if (!contract) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Contrato no encontrado'
          }
        })
      }

      await ObligationModel.delete(obligationId)

      res.json({
        success: true,
        message: 'Obligación eliminada exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }
}


