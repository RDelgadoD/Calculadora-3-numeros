/**
 * Hook personalizado para manejar cálculos
 * Integra el servicio de cálculos con el estado de React
 */

import { useState, useEffect, useCallback } from 'react'
import { obtenerCalculos, crearCalculo } from '../services/calculosService'

/**
 * Hook para obtener y gestionar cálculos
 */
export const useCalculos = ({
  clienteId,
  userId = null,
  fechaInicio = null,
  fechaFin = null,
  page = 1,
  limit = 20,
  autoFetch = true
}) => {
  const [calculos, setCalculos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const fetchCalculos = useCallback(async () => {
    if (!clienteId) {
      setError('clienteId es requerido')
      return
    }

    setLoading(true)
    setError(null)

    const response = await obtenerCalculos({
      clienteId,
      userId,
      fechaInicio,
      fechaFin,
      page,
      limit
    })

    if (response.success) {
      setCalculos(response.data)
      setPagination(response.meta)
    } else {
      setError(response.error.message)
      setCalculos([])
    }

    setLoading(false)
  }, [clienteId, userId, fechaInicio, fechaFin, page, limit])

  useEffect(() => {
    if (autoFetch && clienteId) {
      fetchCalculos()
    }
  }, [autoFetch, clienteId, fetchCalculos])

  const crearNuevoCalculo = useCallback(async (calculosData) => {
    if (!clienteId) {
      return {
        success: false,
        error: { message: 'clienteId es requerido' }
      }
    }

    setLoading(true)
    const response = await crearCalculo(calculosData, clienteId)

    if (response.success) {
      // Recargar lista después de crear
      await fetchCalculos()
    }

    setLoading(false)
    return response
  }, [clienteId, fetchCalculos])

  return {
    calculos,
    loading,
    error,
    pagination,
    refetch: fetchCalculos,
    crearCalculo: crearNuevoCalculo
  }
}


