/**
 * Servicio para operaciones con ingresos
 */

import api from '../lib/apiClient'

export const ingresosService = {
  list: async (params = {}) => {
    return api.get('/ingresos', params)
  },

  getById: async (id) => {
    return api.get(`/ingresos/${id}`)
  },

  create: async (ingresoData) => {
    return api.post('/ingresos', ingresoData)
  },

  update: async (id, ingresoData) => {
    return api.put(`/ingresos/${id}`, ingresoData)
  },

  delete: async (id) => {
    return api.delete(`/ingresos/${id}`)
  }
}



