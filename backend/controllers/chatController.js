/**
 * Controller para el chat de consultas
 * Usa OpenAI para generar SQL a partir de preguntas en lenguaje natural
 */

import { supabaseAdmin } from '../lib/supabase.js'
import { formatRecordsList } from '../utils/formatResponse.js'
import { generateSQL } from '../services/openaiService.js'

export class ChatController {
  /**
   * Procesar pregunta del usuario y generar respuesta
   */
  static async query(req, res, next) {
    try {
      const { question, conversationContext } = req.body
      const { clienteId } = req.user

      if (!question || typeof question !== 'string' || !question.trim()) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'La pregunta es requerida'
          }
        })
      }

      // Verificar que OpenAI esté configurado
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          success: false,
          error: {
            code: 'CONFIGURATION_ERROR',
            message: 'OPENAI_API_KEY no está configurada. Por favor, configura la variable de entorno.'
          }
        })
      }

      // Generar SQL usando OpenAI con contexto
      const { sql, explanation } = await generateSQL(question.trim(), clienteId, conversationContext || '')

      // Ejecutar SQL usando Supabase
      const result = await ChatController.executeQuery(sql, clienteId)

      // Formatear respuesta
      const answer = ChatController.formatAnswer(question, result, explanation)

      res.json({
        success: true,
        answer,
        data: result.data || null,
        sql: sql, // Incluir SQL para debugging (opcional, quitar en producción)
        explanation
      })
    } catch (error) {
      console.error('Error en chatController:', error)
      
      // Mensaje de error amigable sin detalles técnicos
      const friendlyMessage = error.message?.includes('parse') || error.message?.includes('syntax')
        ? 'Lo siento, no pude entender tu consulta. Por favor, intenta reformular tu pregunta de manera más específica.'
        : error.message?.includes('no está configurada')
        ? 'El servicio de consultas no está configurado. Por favor, contacta al administrador.'
        : 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta reformular tu pregunta.'

      return res.status(500).json({
        success: false,
        error: {
          code: 'QUERY_ERROR',
          message: friendlyMessage
        }
      })
    }
  }

  /**
   * Ejecutar consulta SQL de forma segura
   */
  static async executeQuery(sql, clienteId) {
    try {
      // Intentar usar función RPC si existe
      const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('execute_safe_select', {
        query_text: sql,
        tenant_id: clienteId
      })

      if (!rpcError && rpcData !== null) {
        return {
          data: Array.isArray(rpcData) ? rpcData : [rpcData],
          count: Array.isArray(rpcData) ? rpcData.length : 1
        }
      }

      // Si la función RPC no existe, intentar parsear y ejecutar con SDK
      return await ChatController.executeQueryWithSDK(sql, clienteId)
    } catch (error) {
      // Mejorar mensaje de error para parseo SQL
      if (error.message?.includes('parse') || error.message?.includes('syntax') || error.message?.includes('column')) {
        throw new Error('La consulta generada no es válida. Por favor, reformula tu pregunta de manera más específica.')
      }
      throw new Error(`Error al ejecutar consulta: ${error.message}`)
    }
  }

  /**
   * Ejecutar consulta usando SDK de Supabase (método alternativo)
   * Solo funciona para consultas simples
   */
  static async executeQueryWithSDK(sql, clienteId) {
    // Parsear SQL básico para consultas simples
    const upperSQL = sql.toUpperCase().trim()

    // Detectar tipo de consulta
    if (upperSQL.includes('COUNT(*)') || upperSQL.includes('COUNT(1)')) {
      return await ChatController.handleCountQuery(sql, clienteId)
    }

    if (upperSQL.includes('SUM(')) {
      return await ChatController.handleSumQuery(sql, clienteId)
    }

    if (upperSQL.includes('AVG(')) {
      return await ChatController.handleAvgQuery(sql, clienteId)
    }

    // Para SELECT simples, intentar extraer tabla y ejecutar
    return await ChatController.handleSelectQuery(sql, clienteId)
  }

  /**
   * Manejar consultas COUNT
   */
  static async handleCountQuery(sql, clienteId) {
    const tableMatch = sql.match(/FROM\s+(\w+)/i)
    if (!tableMatch) {
      throw new Error('No se pudo identificar la tabla en la consulta')
    }

    const tableName = tableMatch[1]
    const conditions = ChatController.extractWhereConditions(sql, clienteId)

    let query = supabaseAdmin.from(tableName).select('*', { count: 'exact', head: true })

    // Aplicar condiciones básicas
    for (const condition of conditions) {
      if (condition.field === 'cliente_id') continue // Ya está filtrado
      query = ChatController.applyCondition(query, condition)
    }

    const { count, error } = await query
    if (error) throw error

    return { data: [], count: count || 0 }
  }

  /**
   * Manejar consultas SUM
   */
  static async handleSumQuery(sql, clienteId) {
    const sumMatch = sql.match(/SUM\((\w+)\)/i)
    const tableMatch = sql.match(/FROM\s+(\w+)/i)
    
    if (!sumMatch || !tableMatch) {
      throw new Error('No se pudo parsear la consulta SUM')
    }

    const columnName = sumMatch[1]
    const tableName = tableMatch[1]
    const conditions = ChatController.extractWhereConditions(sql, clienteId)

    let query = supabaseAdmin.from(tableName).select(columnName)
    
    for (const condition of conditions) {
      if (condition.field === 'cliente_id') continue
      query = ChatController.applyCondition(query, condition)
    }

    const { data, error } = await query
    if (error) throw error

    const total = (data || []).reduce((sum, row) => {
      const value = parseFloat(row[columnName]) || 0
      return sum + value
    }, 0)

    return { data: [{ total }], count: data?.length || 0 }
  }

  /**
   * Manejar consultas AVG
   */
  static async handleAvgQuery(sql, clienteId) {
    const avgMatch = sql.match(/AVG\((\w+)\)/i)
    const tableMatch = sql.match(/FROM\s+(\w+)/i)
    
    if (!avgMatch || !tableMatch) {
      throw new Error('No se pudo parsear la consulta AVG')
    }

    const columnName = avgMatch[1]
    const tableName = tableMatch[1]
    const conditions = ChatController.extractWhereConditions(sql, clienteId)

    let query = supabaseAdmin.from(tableName).select(columnName)
    
    for (const condition of conditions) {
      if (condition.field === 'cliente_id') continue
      query = ChatController.applyCondition(query, condition)
    }

    const { data, error } = await query
    if (error) throw error

    const total = (data || []).reduce((sum, row) => {
      const value = parseFloat(row[columnName]) || 0
      return sum + value
    }, 0)

    const avg = data?.length > 0 ? total / data.length : 0

    return { data: [{ average: avg }], count: data?.length || 0 }
  }

  /**
   * Manejar consultas SELECT simples
   */
  static async handleSelectQuery(sql, clienteId) {
    const tableMatch = sql.match(/FROM\s+(\w+)/i)
    if (!tableMatch) {
      throw new Error('No se pudo identificar la tabla en la consulta')
    }

    const tableName = tableMatch[1]
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i)
    const selectFields = selectMatch ? selectMatch[1].split(',').map(f => f.trim()) : ['*']
    
    const conditions = ChatController.extractWhereConditions(sql, clienteId)
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i)
    const limit = limitMatch ? parseInt(limitMatch[1]) : 50

    let query = supabaseAdmin.from(tableName).select(selectFields.join(', ')).limit(limit)

    for (const condition of conditions) {
      if (condition.field === 'cliente_id') continue
      query = ChatController.applyCondition(query, condition)
    }

    const { data, error } = await query
    if (error) throw error

    return { data: data || [], count: data?.length || 0 }
  }

  /**
   * Extraer condiciones WHERE de SQL
   */
  static extractWhereConditions(sql, clienteId) {
    const conditions = []
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i)
    
    if (whereMatch) {
      const whereClause = whereMatch[1]
      // Parsear condiciones básicas (field = 'value', field >= value, etc.)
      const conditionRegex = /(\w+)\s*(=|>=|<=|>|<|ILIKE|LIKE)\s*['"]?([^'"]+)['"]?/gi
      let match
      
      while ((match = conditionRegex.exec(whereClause)) !== null) {
        conditions.push({
          field: match[1],
          operator: match[2].toUpperCase(),
          value: match[3]
        })
      }
    }

    // Asegurar que siempre tenga filtro de cliente_id
    const hasClienteId = conditions.some(c => c.field === 'cliente_id')
    if (!hasClienteId) {
      conditions.push({
        field: 'cliente_id',
        operator: '=',
        value: clienteId
      })
    }

    return conditions
  }

  /**
   * Aplicar condición a query de Supabase
   */
  static applyCondition(query, condition) {
    const { field, operator, value } = condition

    switch (operator) {
      case '=':
        return query.eq(field, value)
      case '>':
        return query.gt(field, value)
      case '>=':
        return query.gte(field, value)
      case '<':
        return query.lt(field, value)
      case '<=':
        return query.lte(field, value)
      case 'ILIKE':
      case 'LIKE':
        return query.ilike(field, `%${value}%`)
      default:
        return query
    }
  }

  /**
   * Formatear respuesta para el usuario
   */
  static formatAnswer(question, result, explanation) {
    const lowerQuestion = question.toLowerCase()

    if (result.count === 0) {
      return 'No se encontraron registros que cumplan con los criterios especificados.'
    }

    if (result.data && result.data.length > 0) {
      const firstItem = result.data[0]

      // Si es un conteo (resultado de COUNT)
      // Verificar si el resultado tiene solo un campo "count" o "Count"
      const keys = Object.keys(firstItem)
      if (keys.length === 1 && (keys[0].toLowerCase() === 'count' || keys[0] === 'Count')) {
        const countValue = firstItem[keys[0]]
        return `Se encontraron ${countValue} registro(s).`
      }
      
      // Si count está definido pero no hay data, es un conteo directo
      if (result.count !== undefined && result.data.length === 0) {
        return `Se encontraron ${result.count} registro(s).`
      }

      // Si es una suma
      if ('total' in firstItem) {
        return `El total es: $${parseFloat(firstItem.total).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }

      // Si es un promedio
      if ('average' in firstItem) {
        return `El promedio es: ${parseFloat(firstItem.average).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }

      // Si es una lista - usar formateo mejorado
      const recordsToShow = result.data.length > 10 ? result.data.slice(0, 10) : result.data
      const formattedList = formatRecordsList(recordsToShow)
      
      if (result.data.length > 10) {
        return `${formattedList}\n\n(Mostrando 10 de ${result.count} registros)`
      }
      
      return formattedList
    }

    return `Consulta ejecutada exitosamente. ${explanation || ''}`
  }
}
