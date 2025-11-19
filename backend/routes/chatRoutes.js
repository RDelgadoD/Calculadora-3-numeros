/**
 * Rutas para el chat de consultas
 */

import express from 'express'
import { ChatController } from '../controllers/chatController.js'

const router = express.Router()

// POST /api/chat/query - Procesar pregunta del usuario
router.post('/query', ChatController.query)

export default router

