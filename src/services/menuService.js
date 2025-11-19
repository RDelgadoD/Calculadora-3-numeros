/**
 * Servicio para gestión del menú dinámico
 */

import { roleService } from './roleService'

/**
 * Definición del menú de la aplicación
 * Esta estructura se sincroniza con la base de datos
 */
export const MENU_STRUCTURE = [
  {
    code: 'contratos',
    label: 'Gestionar contratos',
    icon: '📄',
    view_key: 'contratos',
    orden: 1,
    adminOnly: false
  },
  {
    code: 'admin',
    label: 'Administración',
    icon: '⚙️',
    view_key: 'admin',
    orden: 2,
    adminOnly: true, // Solo visible para admins
    children: [
      {
        code: 'admin-tenant',
        label: 'Gestión de Tenant - Clientes y usuarios',
        icon: '👥',
        view_key: 'admin',
        orden: 1
      },
      {
        code: 'admin-roles',
        label: 'Gestión de Roles',
        icon: '🔐',
        view_key: 'roles',
        orden: 2
      }
    ]
  },
  {
    code: 'ventas',
    label: 'Ventas',
    icon: '💼',
    view_key: 'ventas',
    orden: 3,
    children: [
      {
        code: 'ventas-cotizaciones',
        label: 'Cotizaciones',
        icon: '🧾',
        view_key: 'cotizaciones',
        orden: 1
      },
      {
        code: 'ventas-productos',
        label: 'Productos y servicios',
        icon: '📦',
        view_key: 'productos-servicios',
        orden: 2
      }
    ]
  },
  {
    code: 'clientes-suscripcion',
    label: 'Gestión de Cliente de suscripción',
    icon: '🏢',
    view_key: 'clientes-suscripcion',
    orden: 4,
    adminOnly: true // Solo visible para admins
  },
  {
    code: 'clientes',
    label: 'Gestión de Cliente',
    icon: '👥',
    view_key: 'clientes',
    orden: 5
  }
]

/**
 * Sincronizar el menú con la base de datos
 */
export async function syncMenuToDatabase() {
  try {
    // Primero obtener los items existentes para mapear códigos a IDs
    const existingItems = await getMenuItemsFromDatabase()
    const codeToIdMap = new Map()
    existingItems.forEach(item => {
      codeToIdMap.set(item.code, item.id || item.id)
    })
    
    const menuItems = []
    
    // Procesar items principales primero
    MENU_STRUCTURE.forEach(item => {
      // Agregar el item principal
      menuItems.push({
        code: item.code,
        label: item.label,
        icon: item.icon,
        view_key: item.view_key,
        parent_id: null,
        orden: item.orden || 0
      })
    })
    
    // Sincronizar items principales primero para obtener sus IDs
    const response = await roleService.syncMenuItems(menuItems)
    
    // Ahora obtener los items actualizados para mapear códigos a IDs
    const updatedItems = await getMenuItemsFromDatabase()
    const updatedCodeToIdMap = new Map()
    updatedItems.forEach(item => {
      updatedCodeToIdMap.set(item.code, item.id)
    })
    
    // Procesar submenús con los IDs correctos de los padres
    const submenuItems = []
    MENU_STRUCTURE.forEach(item => {
      if (item.children && Array.isArray(item.children)) {
        const parentId = updatedCodeToIdMap.get(item.code)
        item.children.forEach(child => {
          submenuItems.push({
            code: child.code,
            label: child.label,
            icon: child.icon,
            view_key: child.view_key,
            parent_id: parentId, // Usar el ID del padre
            orden: child.orden || 0
          })
        })
      }
    })
    
    // Sincronizar submenús
    if (submenuItems.length > 0) {
      await roleService.syncMenuItems(submenuItems)
    }
    
    return response.data
  } catch (error) {
    console.error('Error al sincronizar menú:', error)
    throw error
  }
}

/**
 * Obtener items de menú desde la base de datos
 */
export async function getMenuItemsFromDatabase() {
  try {
    const response = await roleService.getMenuItems()
    return response.data
  } catch (error) {
    console.error('Error al obtener items de menú:', error)
    throw error
  }
}

/**
 * Obtener permisos del usuario actual
 */
export async function getUserPermissions() {
  try {
    const response = await roleService.getUserPermissions()
    return response.data
  } catch (error) {
    console.error('Error al obtener permisos del usuario:', error)
    throw error
  }
}

