/**
 * Rutas para gestión de conceptos de ingreso
 */

import express from 'express'
import { ConceptoIngresoController } from '../controllers/conceptoIngresoController.js'

const router = express.Router()

router.get('/', ConceptoIngresoController.list)
router.get('/:id', ConceptoIngresoController.getById)
router.post('/', ConceptoIngresoController.create)
router.put('/:id', ConceptoIngresoController.update)
router.delete('/:id', ConceptoIngresoController.delete)

export default router
