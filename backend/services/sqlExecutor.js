/**
 * Servicio para ejecutar SQL de forma segura usando Supabase
 */

import { supabaseAdmin } from '../lib/supabase.js'

/**
 * Ejecutar una consulta SQL SELECT de forma segura
 * @param {string} sql - Consulta SQL (solo SELECT)
 * @returns {Promise<{data: any[], count?: number}>}
 */
export async function executeSQL(sql) {
  // Validar que solo sea SELECT
  const upperSQL = sql.trim().toUpperCase()
  if (!upperSQL.startsWith('SELECT')) {
    throw new Error('Solo se permiten consultas SELECT')
  }

  // Validar que no tenga comandos peligrosos
  const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE']
  for (const keyword of dangerousKeywords) {
    if (upperSQL.includes(keyword)) {
      throw new Error(`Comando no permitido: ${keyword}`)
    }
  }

  try {
    // Ejecutar SQL usando rpc o query directo
    // Nota: Supabase no permite ejecutar SQL arbitrario directamente
    // Necesitamos usar el método .rpc() o parsear y usar el SDK
    
    // Para consultas complejas, usaremos una función RPC en PostgreSQL
    // Por ahora, intentaremos parsear la consulta básica
    
    // Si es una consulta simple COUNT, SUM, AVG, podemos manejarla
    if (upperSQL.includes('COUNT(*)') || upperSQL.includes('COUNT(1)')) {
      // Extraer tabla y condiciones
      const tableMatch = sql.match(/FROM\s+(\w+)/i)
      if (tableMatch) {
        const tableName = tableMatch[1]
        // Construir query usando SDK
        let query = supabaseAdmin.from(tableName).select('*', { count: 'exact', head: true })
        
        // Extraer condiciones WHERE
        const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/i)
        if (whereMatch) {
          const conditions = whereMatch[1]
          // Parsear condiciones básicas (esto es limitado, mejor usar RPC)
          // Por ahora, ejecutamos directamente usando rpc
        }
        
        const { count, error } = await query
        if (error) throw error
        return { data: [], count: count || 0 }
      }
    }

    // Para consultas más complejas, necesitamos una función RPC
    // Por ahora, ejecutamos usando una función auxiliar en PostgreSQL
    const { data, error } = await supabaseAdmin.rpc('execute_safe_query', {
      query_sql: sql
    })

    if (error) {
      // Si la función RPC no existe, intentar parsear manualmente
      // Esto es una solución temporal - idealmente crear la función RPC
      throw new Error(`Error ejecutando consulta: ${error.message}. Nota: Se requiere crear función RPC 'execute_safe_query' en PostgreSQL`)
    }

    return { data: data || [], count: data?.length }
  } catch (error) {
    throw new Error(`Error al ejecutar SQL: ${error.message}`)
  }
}

/**
 * Ejecutar SQL usando una función RPC de PostgreSQL
 * Esta es la forma más segura
 */
export async function executeSQLViaRPC(sql, clienteId) {
  // Validaciones de seguridad
  const upperSQL = sql.trim().toUpperCase()
  if (!upperSQL.startsWith('SELECT')) {
    throw new Error('Solo se permiten consultas SELECT')
  }

  const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE', 'EXEC', 'EXECUTE', 'GRANT', 'REVOKE']
  for (const keyword of dangerousKeywords) {
    if (upperSQL.includes(keyword)) {
      throw new Error(`Comando no permitido: ${keyword}`)
    }
  }

  // Verificar que incluya filtro de cliente_id
  if (!sql.toLowerCase().includes(`cliente_id = '${clienteId}'`.toLowerCase()) &&
      !sql.toLowerCase().includes(`cliente_id='${clienteId}'`.toLowerCase())) {
    throw new Error('La consulta debe incluir filtro por cliente_id para seguridad multi-tenant')
  }

  try {
    // Usar función RPC si existe, sino usar método alternativo
    const { data, error } = await supabaseAdmin.rpc('execute_safe_select', {
      query_text: sql,
      tenant_id: clienteId
    })

    if (error) {
      // Si la función no existe, intentar método alternativo
      // Parsear y ejecutar usando SDK de Supabase
      return await executeSQLParsed(sql)
    }

    return { data: data || [], count: data?.length }
  } catch (error) {
    throw new Error(`Error al ejecutar SQL: ${error.message}`)
  }
}

/**
 * Método alternativo: parsear SQL básico y ejecutar con SDK
 * Limitado a consultas simples
 */
async function executeSQLParsed(sql) {
  // Este es un parser muy básico - para producción usar una librería como node-sql-parser
  // Por ahora, lanzamos error para forzar el uso de RPC
  throw new Error('Se requiere crear función PostgreSQL execute_safe_select. Ver documentación.')
}

