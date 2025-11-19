/**
 * Servicio para operaciones con contratos
 * Consume la API del backend
 */

import api from '../lib/apiClient'

export const contractsService = {
  /**
   * Listar contratos con filtros y paginación
   */
  list: async (params = {}) => {
    return api.get('/contracts', params)
  },

  /**
   * Obtener contrato por ID
   */
  getById: async (id) => {
    return api.get(`/contracts/${id}`)
  },

  /**
   * Crear contrato
   */
  create: async (contractData) => {
    return api.post('/contracts', contractData)
  },

  /**
   * Actualizar contrato
   */
  update: async (id, contractData) => {
    return api.put(`/contracts/${id}`, contractData)
  },

  /**
   * Eliminar contrato
   */
  delete: async (id) => {
    return api.delete(`/contracts/${id}`)
  },

  /**
   * Obtener adjuntos de un contrato
   */
  getAttachments: async (contractId) => {
    return api.get(`/contracts/${contractId}/attachments`)
  },

  /**
   * Crear adjunto
   */
  createAttachment: async (contractId, attachmentData) => {
    return api.post(`/contracts/${contractId}/attachments`, attachmentData)
  },

  /**
   * Eliminar adjunto
   */
  deleteAttachment: async (contractId, attachmentId) => {
    return api.delete(`/contracts/${contractId}/attachments/${attachmentId}`)
  },

  /**
   * Obtener cuotas de un contrato
   */
  getInstallments: async (contractId) => {
    return api.get(`/contracts/${contractId}/installments`)
  },

  /**
   * Crear cuota
   */
  createInstallment: async (contractId, installmentData) => {
    return api.post(`/contracts/${contractId}/installments`, installmentData)
  },

  /**
   * Actualizar cuota
   */
  updateInstallment: async (contractId, installmentId, installmentData) => {
    return api.put(`/contracts/${contractId}/installments/${installmentId}`, installmentData)
  },

  /**
   * Eliminar cuota
   */
  deleteInstallment: async (contractId, installmentId) => {
    return api.delete(`/contracts/${contractId}/installments/${installmentId}`)
  },

  /**
   * Obtener obligaciones de un contrato
   */
  getObligations: async (contractId) => {
    return api.get(`/contracts/${contractId}/obligations`)
  },

  /**
   * Crear obligación
   */
  createObligation: async (contractId, obligationData) => {
    return api.post(`/contracts/${contractId}/obligations`, obligationData)
  },

  /**
   * Actualizar obligación
   */
  updateObligation: async (contractId, obligationId, obligationData) => {
    return api.put(`/contracts/${contractId}/obligations/${obligationId}`, obligationData)
  },

  /**
   * Eliminar obligación
   */
  deleteObligation: async (contractId, obligationId) => {
    return api.delete(`/contracts/${contractId}/obligations/${obligationId}`)
  }
}


