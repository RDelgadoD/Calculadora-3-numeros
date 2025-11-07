import { useState, useEffect } from 'react'
import { supabase } from './supabase'

export function useUserInfo(userId) {
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
          setUserInfo({
            id: record.id,
            nombreCompleto: record.nombre_completo,
            email: record.email,
            activo: record.activo,
            rol: record.rol || 'usuario',
            clienteId: record.cliente_id,
            clienteNombre: record.cliente_nombre || 'Sin cliente asignado',
            clienteActivo: true
          })
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

  return { userInfo, loading, error }
}
