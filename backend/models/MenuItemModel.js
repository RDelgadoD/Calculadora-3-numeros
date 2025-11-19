/**
 * Model para operaciones con items de menú
 * Capa de acceso a datos usando Supabase JS
 */

import { supabaseAdmin } from '../lib/supabase.js'

export class MenuItemModel {
  /**
   * Obtener todos los items de menú de un cliente (árbol completo)
   */
  static async findAll(clienteId) {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('activo', true)
      .order('orden', { ascending: true })
      .order('label', { ascending: true })

    if (error) throw error
    return data
  }

  /**
   * Obtener items de menú en formato de árbol
   */
  static async findTree(clienteId) {
    const items = await this.findAll(clienteId)
    
    // Separar items raíz y hijos
    const rootItems = items.filter(item => !item.parent_id)
    const childItems = items.filter(item => item.parent_id)

    // Construir árbol
    const buildTree = (parent) => {
      const children = childItems
        .filter(item => item.parent_id === parent.id)
        .map(child => buildTree(child))
      
      return {
        ...parent,
        children: children.length > 0 ? children : undefined
      }
    }

    return rootItems.map(item => buildTree(item))
  }

  /**
   * Crear o actualizar items de menú (sincronización)
   */
  static async syncMenuItems(clienteId, menuItems) {
    // Obtener items existentes
    const existingItems = await this.findAll(clienteId)
    const existingCodes = new Set(existingItems.map(item => item.code))

    const results = {
      created: [],
      updated: [],
      errors: []
    }

    for (const item of menuItems) {
      try {
        const itemData = {
          cliente_id: clienteId,
          code: item.code,
          label: item.label,
          icon: item.icon || null,
          view_key: item.view_key || item.code,
          parent_id: item.parent_id || null,
          orden: item.orden || 0,
          activo: true
        }

        if (existingCodes.has(item.code)) {
          // Actualizar item existente
          const existingItem = existingItems.find(i => i.code === item.code)
          const { data, error } = await supabaseAdmin
            .from('menu_items')
            .update({
              ...itemData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingItem.id)
            .select()
            .single()

          if (error) throw error
          results.updated.push(data)
        } else {
          // Crear nuevo item
          const { data, error } = await supabaseAdmin
            .from('menu_items')
            .insert(itemData)
            .select()
            .single()

          if (error) throw error
          results.created.push(data)
        }
      } catch (error) {
        results.errors.push({ code: item.code, error: error.message })
      }
    }

    return results
  }

  /**
   * Obtener permisos de un usuario
   */
  static async getUserPermissions(userId, clienteId) {
    // Primero obtener el rol del usuario
    const { data: user, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('role_id, rol')
      .eq('id', userId)
      .eq('cliente_id', clienteId)
      .single()

    if (userError) throw userError

    // Si es admin, retornar todos los items
    if (user.rol === 'admin') {
      return await this.findAll(clienteId)
    }

    // Si no tiene rol, retornar vacío
    if (!user.role_id) {
      return []
    }

    // Obtener permisos del rol
    const { data, error } = await supabaseAdmin
      .from('role_permissions')
      .select(`
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
      .eq('role_id', user.role_id)

    if (error) throw error

    return data
      .map(item => item.menu_items)
      .filter(item => item !== null)
      .sort((a, b) => {
        if (a.orden !== b.orden) return a.orden - b.orden
        return a.label.localeCompare(b.label)
      })
  }
}

