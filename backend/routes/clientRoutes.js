/**
 * Rutas para gestión de clientes (contratantes)
 */

import express from 'express'
import { ClientController } from '../controllers/clientController.js'

const router = express.Router()

router.get('/', ClientController.list)
router.get('/:id', ClientController.getById)
router.post('/', ClientController.create)
router.put('/:id', ClientController.update)
router.delete('/:id', ClientController.delete)

export default router


