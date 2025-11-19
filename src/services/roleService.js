/**
 * Servicio para gestión de roles y permisos
 */

import api from '../lib/apiClient'

export const roleService = {
  /**
   * Listar todos los roles
   */
  list: async () => {
    return api.get('/roles')
  },

  /**
   * Obtener un rol por ID
   */
  getById: async (id) => {
    return api.get(`/roles/${id}`)
  },

  /**
   * Crear un nuevo rol
   */
  create: async (roleData) => {
    return api.post('/roles', roleData)
  },

  /**
   * Actualizar un rol
   */
  update: async (id, roleData) => {
    return api.put(`/roles/${id}`, roleData)
  },

  /**
   * Eliminar un rol
   */
  delete: async (id) => {
    return api.delete(`/roles/${id}`)
  },

  /**
   * Obtener items de menú disponibles
   */
  getMenuItems: async () => {
    return api.get('/roles/menu-items')
  },

  /**
   * Sincronizar items de menú
   */
  syncMenuItems: async (menuItems) => {
    return api.post('/roles/menu-items/sync', { menuItems })
  },

  /**
   * Obtener permisos del usuario actual
   */
  getUserPermissions: async () => {
    return api.get('/roles/user-permissions')
  }
}

