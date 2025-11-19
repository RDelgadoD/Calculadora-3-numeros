import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { getUserPermissions } from '../services/menuService'

export function useUserInfo(userId) {
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissions, setPermissions] = useState([])

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchUserInfo = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_user_info', { user_uuid: userId })

        if (error) throw error

        const record = Array.isArray(data) ? data[0] : data

        if (record) {
          const userInfoData = {
            id: record.id,
            nombreCompleto: record.nombre_completo,
            email: record.email,
            activo: record.activo,
            rol: record.rol || 'usuario',
            clienteId: record.cliente_id,
            clienteNombre: record.cliente_nombre || 'Sin cliente asignado',
            clienteActivo: true,
            roleId: record.role_id || null
          }

          setUserInfo(userInfoData)

          // Si es admin, tiene acceso a todo (no necesitamos cargar permisos)
          if (userInfoData.rol === 'admin') {
            setPermissions([]) // Array vacío significa acceso total
          } else if (userInfoData.roleId) {
            // Cargar permisos del rol desde el backend solo si tiene roleId
            try {
              console.log('Cargando permisos para usuario con roleId:', userInfoData.roleId)
              const permissionsData = await getUserPermissions()
              console.log('Permisos cargados:', permissionsData)
              setPermissions(permissionsData || [])
            } catch (permError) {
              console.error('Error al cargar permisos:', permError)
              setPermissions([])
            }
          } else {
            // Usuario sin roleId asignado
            console.log('Usuario sin roleId asignado, no se cargan permisos')
            setPermissions([])
          }
        } else {
          setError('Usuario no encontrado en el sistema')
        }
      } catch (err) {
        console.error('Error al obtener información del usuario:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserInfo()
  }, [userId])

  return { userInfo, loading, error, permissions }
}
