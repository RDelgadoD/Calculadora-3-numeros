/**
 * Controller para tablas configurables (enums)
 */

import { ConfigModel } from '../models/ConfigModel.js'

export class ConfigController {
  /**
   * GET /api/config/tipos-contratos
   */
  static async getTiposContratos(req, res, next) {
    try {
      const { clienteId } = req.user
      const data = await ConfigModel.getTiposContratos(clienteId)
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/config/estados-contratos
   */
  static async getEstadosContratos(req, res, next) {
    try {
      const { clienteId } = req.user
      const data = await ConfigModel.getEstadosContratos(clienteId)
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/config/tipos-documentos
   */
  static async getTiposDocumentos(req, res, next) {
    try {
      const { clienteId } = req.user
      const data = await ConfigModel.getTiposDocumentos(clienteId)
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/config/estados-pagos
   */
  static async getEstadosPagos(req, res, next) {
    try {
      const { clienteId } = req.user
      const data = await ConfigModel.getEstadosPagos(clienteId)
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/config/tipos-actividades
   */
  static async getTiposActividades(req, res, next) {
    try {
      const { clienteId } = req.user
      const data = await ConfigModel.getTiposActividades(clienteId)
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/config/productos
   */
  static async getProductos(req, res, next) {
    try {
      const { clienteId } = req.user
      const data = await ConfigModel.getProductos(clienteId)
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/config/estados-obligaciones
   */
  static async getEstadosObligaciones(req, res, next) {
    try {
      const { clienteId } = req.user
      const data = await ConfigModel.getEstadosObligaciones(clienteId)
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/config/tipos-identificacion
   */
  static async getTiposIdentificacion(req, res, next) {
    try {
      const { clienteId } = req.user
      const data = await ConfigModel.getTiposIdentificacion(clienteId)
      res.json({ success: true, data })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/config/all
   * Obtener todas las configuraciones de una vez
   */
  static async getAll(req, res, next) {
    try {
      const { clienteId } = req.user

      const [
        tiposContratos,
        estadosContratos,
        tiposDocumentos,
        estadosPagos,
        tiposActividades,
        productos,
        estadosObligaciones,
        tiposIdentificacion
      ] = await Promise.all([
        ConfigModel.getTiposContratos(clienteId),
        ConfigModel.getEstadosContratos(clienteId),
        ConfigModel.getTiposDocumentos(clienteId),
        ConfigModel.getEstadosPagos(clienteId),
        ConfigModel.getTiposActividades(clienteId),
        ConfigModel.getProductos(clienteId),
        ConfigModel.getEstadosObligaciones(clienteId),
        ConfigModel.getTiposIdentificacion(clienteId)
      ])

      res.json({
        success: true,
        data: {
          tiposContratos,
          estadosContratos,
          tiposDocumentos,
          estadosPagos,
          tiposActividades,
          productos,
          estadosObligaciones,
          tiposIdentificacion
        }
      })
    } catch (error) {
      next(error)
    }
  }
}


