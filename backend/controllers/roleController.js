/**
 * Controller para gestión de roles
 */

import { RoleModel } from '../models/RoleModel.js'
import { MenuItemModel } from '../models/MenuItemModel.js'

export class RoleController {
  /**
   * Listar todos los roles
   */
  static async list(req, res, next) {
    try {
      const { clienteId } = req.user
      const roles = await RoleModel.findAll(clienteId)
      
      res.json({
        success: true,
        data: roles
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Obtener un rol por ID
   */
  static async getById(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      const role = await RoleModel.findById(id, clienteId)
      
      if (!role) {
        return res.status(404).json({
          success: false,
          error: { message: 'Rol no encontrado' }
        })
      }

      // Obtener permisos del rol
      const permissions = await RoleModel.getPermissions(id, clienteId)

      res.json({
        success: true,
        data: {
          ...role,
          permissions: permissions.map(p => p.id)
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Crear un nuevo rol
   */
  static async create(req, res, next) {
    try {
      const { clienteId } = req.user
      const { name, description, permissions } = req.body

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'El nombre del rol es requerido' }
        })
      }

      // Crear el rol
      const role = await RoleModel.create({
        cliente_id: clienteId,
        name: name.trim(),
        description: description || null,
        activo: true
      })

      // Asignar permisos si se proporcionaron
      if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        await RoleModel.updatePermissions(role.id, clienteId, permissions)
      }

      // Obtener el rol completo con permisos
      const roleWithPermissions = await RoleModel.findById(role.id, clienteId)
      const rolePermissions = await RoleModel.getPermissions(role.id, clienteId)

      res.status(201).json({
        success: true,
        data: {
          ...roleWithPermissions,
          permissions: rolePermissions.map(p => p.id)
        }
      })
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({
          success: false,
          error: { message: 'Ya existe un rol con ese nombre' }
        })
      }
      next(error)
    }
  }

  /**
   * Actualizar un rol
   */
  static async update(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params
      const { name, description, activo, permissions } = req.body

      // Verificar que el rol existe
      const existingRole = await RoleModel.findById(id, clienteId)
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          error: { message: 'Rol no encontrado' }
        })
      }

      // Actualizar el rol
      const updateData = {}
      if (name !== undefined) updateData.name = name.trim()
      if (description !== undefined) updateData.description = description
      if (activo !== undefined) updateData.activo = activo

      const role = await RoleModel.update(id, clienteId, updateData)

      // Actualizar permisos si se proporcionaron
      if (permissions !== undefined && Array.isArray(permissions)) {
        await RoleModel.updatePermissions(id, clienteId, permissions)
      }

      // Obtener el rol completo con permisos
      const roleWithPermissions = await RoleModel.findById(id, clienteId)
      const rolePermissions = await RoleModel.getPermissions(id, clienteId)

      res.json({
        success: true,
        data: {
          ...roleWithPermissions,
          permissions: rolePermissions.map(p => p.id)
        }
      })
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        return res.status(400).json({
          success: false,
          error: { message: 'Ya existe un rol con ese nombre' }
        })
      }
      next(error)
    }
  }

  /**
   * Eliminar un rol (soft delete)
   */
  static async delete(req, res, next) {
    try {
      const { clienteId } = req.user
      const { id } = req.params

      const role = await RoleModel.delete(id, clienteId)

      res.json({
        success: true,
        data: role
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Obtener items de menú disponibles (formato plano para construir árbol en frontend)
   */
  static async getMenuItems(req, res, next) {
    try {
      const { clienteId } = req.user
      // Devolver formato plano para que el frontend construya el árbol
      const menuItems = await MenuItemModel.findAll(clienteId)

      res.json({
        success: true,
        data: menuItems
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Sincronizar items de menú desde el frontend
   */
  static async syncMenuItems(req, res, next) {
    try {
      const { clienteId } = req.user
      const { menuItems } = req.body

      if (!Array.isArray(menuItems)) {
        return res.status(400).json({
          success: false,
          error: { message: 'menuItems debe ser un array' }
        })
      }

      const result = await MenuItemModel.syncMenuItems(clienteId, menuItems)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Obtener permisos del usuario actual
   */
  static async getUserPermissions(req, res, next) {
    try {
      const { clienteId } = req.user
      const userId = req.user.id

      const permissions = await MenuItemModel.getUserPermissions(userId, clienteId)

      res.json({
        success: true,
        data: permissions
      })
    } catch (error) {
      next(error)
    }
  }
}

