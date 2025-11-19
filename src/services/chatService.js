/**
 * Servicio para consultas de chat usando MCP de Supabase
 */

import api from '../lib/apiClient'

export const chatService = {
  /**
   * Enviar pregunta al asistente de chat
   * @param {string} question - Pregunta del usuario
   * @param {string} conversationContext - Contexto de la conversación anterior
   * @returns {Promise} Respuesta del asistente con datos
   */
  query: async (question, conversationContext = '') => {
    return api.post('/chat/query', { 
      question,
      conversationContext 
    })
  }
}

