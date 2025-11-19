/**
 * Rutas para gestión de contratos
 */

import express from 'express'
import { ContractController } from '../controllers/contractController.js'

const router = express.Router()

// Rutas principales
router.get('/', ContractController.list)
router.get('/:id', ContractController.getById)
router.post('/', ContractController.create)
router.put('/:id', ContractController.update)
router.delete('/:id', ContractController.delete)

// Rutas de adjuntos
router.get('/:id/attachments', ContractController.getAttachments)
router.post('/:id/attachments', ContractController.createAttachment)
router.delete('/:id/attachments/:attachmentId', ContractController.deleteAttachment)

// Rutas de cuotas
router.get('/:id/installments', ContractController.getInstallments)
router.post('/:id/installments', ContractController.createInstallment)
router.put('/:id/installments/:installmentId', ContractController.updateInstallment)
router.delete('/:id/installments/:installmentId', ContractController.deleteInstallment)

// Rutas de obligaciones
router.get('/:id/obligations', ContractController.getObligations)
router.post('/:id/obligations', ContractController.createObligation)
router.put('/:id/obligations/:obligationId', ContractController.updateObligation)
router.delete('/:id/obligations/:obligationId', ContractController.deleteObligation)

export default router


