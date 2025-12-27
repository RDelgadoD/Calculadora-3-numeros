/**
 * Servicio para operaciones con conceptos de ingreso
 */

import api from '../lib/apiClient'

export const conceptosIngresoService = {
  list: async (params = {}) => {
    return api.get('/conceptos-ingreso', params)
  },

  getById: async (id) => {
    return api.get(`/conceptos-ingreso/${id}`)
  },

  create: async (conceptoData) => {
    return api.post('/conceptos-ingreso', conceptoData)
  },

  update: async (id, conceptoData) => {
    return api.put(`/conceptos-ingreso/${id}`, conceptoData)
  },

  delete: async (id) => {
    return api.delete(`/conceptos-ingreso/${id}`)
  }
}



