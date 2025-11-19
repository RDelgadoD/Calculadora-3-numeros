/**
 * Controller para gestión de clientes (contratantes)
 */

import { ClientModel } from '../models/ClientModel.js'

export class ClientController {
  /**
   * GET /api/clients
   * Listar clientes con paginación
   */
  static async list(req, res, next) {
    try {
      const { clienteId } = req.user
      const {
        page = 1,
        limit = 50,
        tipo,
        search
      } = req.query

      const filters = { tipo, search }

      // Remover filtros vacíos
      Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key]
      })

      const result = await ClientModel.findAll({
        clienteId,
        filters,
        page: parseInt(page),
        limit: parseInt(limit)
      })

      res.json({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/clients/:id
   * Obtener cliente por ID
   */
  static async getById(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      const client = await ClientModel.findById(id, clienteId)

      if (!client) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Cliente no encontrado'
          }
        })
      }

      res.json({
        success: true,
        data: client
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/clients
   * Crear cliente
   */
  static async create(req, res, next) {
    try {
      const { clienteId } = req.user
      const clientData = req.body

      // Validaciones
      if (!clientData.tipo) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El tipo de cliente es obligatorio (natural/juridica)'
          }
        })
      }

      if (!clientData.tipo_identificacion) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El tipo de identificación es obligatorio'
          }
        })
      }

      if (!clientData.nro_identificacion) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El número de identificación es obligatorio'
          }
        })
      }

      // Validaciones específicas por tipo
      if (clientData.tipo === 'natural') {
        if (!clientData.nombre1) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'El primer nombre es obligatorio para persona natural'
            }
          })
        }

        if (!clientData.apellido1) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'El primer apellido es obligatorio para persona natural'
            }
          })
        }
      } else if (clientData.tipo === 'juridica') {
        if (!clientData.razon_social) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'La razón social es obligatoria para persona jurídica'
            }
          })
        }
      }

      // Verificar que combinación tipo_id + nro_id no exista
      const identificacionExists = await ClientModel.checkIdentificacionExists(
        clientData.tipo_identificacion,
        clientData.nro_identificacion,
        clienteId
      )

      if (identificacionExists) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: 'Ya existe un cliente con este tipo y número de identificación'
          }
        })
      }

      const newClient = {
        ...clientData,
        cliente_id: clienteId
      }

      const client = await ClientModel.create(newClient)

      res.status(201).json({
        success: true,
        data: client,
        message: 'Cliente creado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/clients/:id
   * Actualizar cliente
   */
  static async update(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params
      const clientData = req.body

      // Verificar que existe
      const existingClient = await ClientModel.findById(id, clienteId)
      if (!existingClient) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Cliente no encontrado'
          }
        })
      }

      // Si se actualiza tipo_id o nro_id, verificar que no exista
      if (
        (clientData.tipo_identificacion && clientData.tipo_identificacion !== existingClient.tipo_identificacion) ||
        (clientData.nro_identificacion && clientData.nro_identificacion !== existingClient.nro_identificacion)
      ) {
        const tipoId = clientData.tipo_identificacion || existingClient.tipo_identificacion
        const nroId = clientData.nro_identificacion || existingClient.nro_identificacion

        const identificacionExists = await ClientModel.checkIdentificacionExists(
          tipoId,
          nroId,
          clienteId,
          id
        )

        if (identificacionExists) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'DUPLICATE_ENTRY',
              message: 'Ya existe un cliente con este tipo y número de identificación'
            }
          })
        }
      }

      const updatedClient = await ClientModel.update(id, clienteId, clientData)

      res.json({
        success: true,
        data: updatedClient,
        message: 'Cliente actualizado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/clients/:id
   * Eliminar cliente
   */
  static async delete(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      // Verificar que existe
      const client = await ClientModel.findById(id, clienteId)
      if (!client) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Cliente no encontrado'
          }
        })
      }

      await ClientModel.delete(id, clienteId)

      res.json({
        success: true,
        message: 'Cliente eliminado exitosamente'
      })
    } catch (error) {
      next(error)
    }
  }
}


