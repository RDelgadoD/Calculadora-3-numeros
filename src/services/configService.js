/**
 * Servicio para tablas configurables
 */

import api from '../lib/apiClient'

export const configService = {
  /**
   * Obtener todas las configuraciones de una vez
   */
  getAll: async () => {
    return api.get('/config/all')
  },

  getTiposContratos: async () => {
    return api.get('/config/tipos-contratos')
  },

  getEstadosContratos: async () => {
    return api.get('/config/estados-contratos')
  },

  getTiposDocumentos: async () => {
    return api.get('/config/tipos-documentos')
  },

  getEstadosPagos: async () => {
    return api.get('/config/estados-pagos')
  },

  getTiposActividades: async () => {
    return api.get('/config/tipos-actividades')
  },

  getProductos: async () => {
    return api.get('/config/productos')
  },

  getEstadosObligaciones: async () => {
    return api.get('/config/estados-obligaciones')
  },

  getTiposIdentificacion: async () => {
    return api.get('/config/tipos-identificacion')
  }
}


