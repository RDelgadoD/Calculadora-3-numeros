/**
 * Rutas para gestión de ingresos
 */

import express from 'express'
import { IngresoController } from '../controllers/ingresoController.js'

const router = express.Router()

router.get('/', IngresoController.list)
router.get('/:id', IngresoController.getById)
router.post('/', IngresoController.create)
router.put('/:id', IngresoController.update)
router.delete('/:id', IngresoController.delete)

export default router
