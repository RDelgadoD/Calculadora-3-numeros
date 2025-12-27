/**
 * Rutas para gestión de bancos (cuentas bancarias)
 */

import express from 'express'
import { BancoController } from '../controllers/bancoController.js'

const router = express.Router()

router.get('/search', BancoController.search)
router.get('/', BancoController.list)
router.get('/:id', BancoController.getById)
router.post('/', BancoController.create)
router.put('/:id', BancoController.update)
router.delete('/:id', BancoController.delete)

export default router
