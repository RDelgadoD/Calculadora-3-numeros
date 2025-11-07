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
          .from('usuarios')
          .select(`
            id,
            nombre_completo,
            email,
            activo,
            rol,
            cliente_id,
            clientes (
              id,
              nombre,
              activo
            )
          `)
          .eq('id', userId)
          .single()

        if (error) throw error

        if (data) {
          setUserInfo({
            id: data.id,
            nombreCompleto: data.nombre_completo,
            email: data.email,
            activo: data.activo,
            rol: data.rol || 'usuario',
            clienteId: data.cliente_id,
            clienteNombre: data.clientes?.nombre || 'Sin cliente asignado',
            clienteActivo: data.clientes?.activo || false
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
