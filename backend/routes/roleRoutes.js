/**
 * Rutas para gestión de roles
 */

import express from 'express'
import { RoleController } from '../controllers/roleController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// Rutas de roles
router.get('/', RoleController.list)
router.get('/menu-items', RoleController.getMenuItems)
router.get('/user-permissions', RoleController.getUserPermissions)
router.post('/menu-items/sync', RoleController.syncMenuItems)
router.get('/:id', RoleController.getById)
router.post('/', RoleController.create)
router.put('/:id', RoleController.update)
router.delete('/:id', RoleController.delete)

export default router

