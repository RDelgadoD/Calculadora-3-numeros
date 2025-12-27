/**
 * Rutas para configuración inicial del sistema
 */

import express from 'express'
import { SetupController } from '../controllers/setupController.js'

const router = express.Router()

// POST /api/setup/assign-default-cliente
router.post('/assign-default-cliente', SetupController.assignDefaultCliente)

// GET /api/setup/status
router.get('/status', SetupController.getStatus)

export default router

