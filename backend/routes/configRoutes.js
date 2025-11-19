/**
 * Rutas para tablas configurables
 */

import express from 'express'
import { ConfigController } from '../controllers/configController.js'

const router = express.Router()

router.get('/all', ConfigController.getAll)
router.get('/tipos-contratos', ConfigController.getTiposContratos)
router.get('/estados-contratos', ConfigController.getEstadosContratos)
router.get('/tipos-documentos', ConfigController.getTiposDocumentos)
router.get('/estados-pagos', ConfigController.getEstadosPagos)
router.get('/tipos-actividades', ConfigController.getTiposActividades)
router.get('/productos', ConfigController.getProductos)
router.get('/estados-obligaciones', ConfigController.getEstadosObligaciones)
router.get('/tipos-identificacion', ConfigController.getTiposIdentificacion)

export default router


