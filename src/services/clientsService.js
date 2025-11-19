/**
 * Servicio para operaciones con clientes (contratantes)
 */

import api from '../lib/apiClient'

export const clientsService = {
  list: async (params = {}) => {
    return api.get('/clients', params)
  },

  getById: async (id) => {
    return api.get(`/clients/${id}`)
  },

  create: async (clientData) => {
    return api.post('/clients', clientData)
  },

  update: async (id, clientData) => {
    return api.put(`/clients/${id}`, clientData)
  },

  delete: async (id) => {
    return api.delete(`/clients/${id}`)
  }
}


