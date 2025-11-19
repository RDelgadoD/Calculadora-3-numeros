/**
 * Model para operaciones con roles
 * Capa de acceso a datos usando Supabase JS
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class RoleModel {
  /**
   * Obtener todos los roles de un cliente
   */
  static async findAll(clienteId) {
    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('activo', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data
  }

  /**
   * Obtener un rol por ID
   */
  static async findById(id, clienteId) {
    const { data, error } = await supabaseAdmin
      .from('roles')
      .select('*')
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Crear un nuevo rol
   */
  static async create(roleData) {
    const { data, error } = await supabaseAdmin
      .from('roles')
      .insert(roleData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Actualizar un rol
   */
  static async update(id, clienteId, roleData) {
    const { data, error } = await supabaseAdmin
      .from('roles')
      .update({
        ...roleData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Eliminar un rol (soft delete)
   */
  static async delete(id, clienteId) {
    const { data, error } = await supabaseAdmin
      .from('roles')
      .update({ activo: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('cliente_id', clienteId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Obtener permisos de un rol
   */
  static async getPermissions(roleId, clienteId) {
    // Verificar que el rol pertenece al cliente
    const role = await this.findById(roleId, clienteId)
    if (!role) {
      throw new Error('Rol no encontrado')
    }

    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .select(`
        menu_item_id,
        menu_items (
          id,
          code,
          label,
          icon,
          view_key,
          parent_id,
          orden
        )
      `)
      .eq('role_id', roleId)

    if (error) throw error
    return data.map(item => item.menu_items)
  }

  /**
   * Actualizar permisos de un rol
   */
  static async updatePermissions(roleId, clienteId, menuItemIds) {
    // Verificar que el rol pertenece al cliente
    const role = await this.findById(roleId, clienteId)
    if (!role) {
      throw new Error('Rol no encontrado')
    }

    // Eliminar permisos existentes
    const { error: deleteError } = await supabaseAdmin
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)

    if (deleteError) throw deleteError

    // Insertar nuevos permisos
    if (menuItemIds && menuItemIds.length > 0) {
      const permissions = menuItemIds.map(menuItemId => ({
        role_id: roleId,
        menu_item_id: menuItemId
      }))

      const { error: insertError } = await supabaseAdmin
        .from('role_permissions')
        .insert(permissions)

      if (insertError) throw insertError
    }

    return { success: true }
  }
}

