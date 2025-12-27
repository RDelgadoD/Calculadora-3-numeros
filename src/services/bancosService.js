/**
 * Servicio para operaciones con bancos (cuentas bancarias)
 */

import api from '../lib/apiClient'

export const bancosService = {
  list: async (params = {}) => {
    return api.get('/bancos', params)
  },

  getById: async (id) => {
    return api.get(`/bancos/${id}`)
  },

  create: async (bancoData) => {
    return api.post('/bancos', bancoData)
  },

  update: async (id, bancoData) => {
    return api.put(`/bancos/${id}`, bancoData)
  },

  delete: async (id) => {
    return api.delete(`/bancos/${id}`)
  },

  searchByBanco: async (bancoNombre, search = '') => {
    return api.get('/bancos/search', { banco_nombre: bancoNombre, search })
  }
}



