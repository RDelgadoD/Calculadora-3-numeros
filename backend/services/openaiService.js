/**
 * Servicio para generar SQL usando OpenAI
 */

import OpenAI from 'openai'
import dotenv from 'dotenv'

// Cargar variables de entorno
if (!process.env.OPENAI_API_KEY) {
  dotenv.config()
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Esquema de la base de datos para contexto
 */
const DATABASE_SCHEMA = `
-- =====================================================
-- ESQUEMA DE BASE DE DATOS MULTI-TENANT - GESTIÓN DE CONTRATOS
-- =====================================================

-- RELACIONES PRINCIPALES:
-- clientes (tenant) -> usuarios -> contracts -> installments (cuotas de pago)
-- contracts -> clients (contratantes)
-- installments -> estados_pagos (estado de cada cuota)

-- =====================================================
-- TABLAS PRINCIPALES
-- =====================================================

-- Tabla: clientes (tenants/entidades)
-- Campos: id (UUID), nombre (VARCHAR), activo (BOOLEAN), created_at, updated_at
-- Descripción: Representa las empresas/organizaciones que usan el sistema

-- Tabla: usuarios (usuarios del sistema)
-- Campos: id (UUID), cliente_id (UUID FK a clientes), nombre_completo (VARCHAR), email (VARCHAR), activo (BOOLEAN), rol (VARCHAR: 'admin'|'usuario'), created_at, updated_at
-- Descripción: Usuarios del sistema, cada uno pertenece a un cliente (tenant)

-- Tabla: clients (contratantes - personas naturales o jurídicas)
-- Campos: id (UUID), cliente_id (UUID FK a clientes), tipo (VARCHAR: 'natural'|'juridica'), tipo_identificacion (UUID FK), nro_identificacion (VARCHAR), direccion (TEXT), telefono (VARCHAR), foto (TEXT), nombre1 (VARCHAR), nombre2 (VARCHAR), apellido1 (VARCHAR), apellido2 (VARCHAR), razon_social (VARCHAR), created_at, updated_at
-- IMPORTANTE: 
--   - Si tipo = 'juridica': el nombre está en razon_social
--   - Si tipo = 'natural': el nombre está en nombre1, apellido1 (puede tener nombre2, apellido2)
--   - Para obtener el nombre completo: COALESCE(razon_social, CONCAT(nombre1, ' ', COALESCE(nombre2, ''), ' ', apellido1, ' ', COALESCE(apellido2, '')))

-- Tabla: contracts (contratos principales)
-- Campos: id (UUID), cliente_id (UUID FK a clientes), numero_contrato (VARCHAR), fecha_inicio (DATE), fecha_terminacion (DATE), fecha_liquidacion (DATE), client_id (UUID FK a clients), valor_contrato (NUMERIC), objeto_contrato (TEXT), tipo_contrato_id (UUID FK), estado_contrato_id (UUID FK), created_by (UUID FK a usuarios), created_at, updated_at
-- Descripción: Contratos firmados con clientes (contratantes)
-- RELACIONES:
--   - client_id -> clients.id (el contratante)
--   - Cada contrato puede tener múltiples cuotas de pago (installments)

-- Tabla: installments (cuotas de pago)
-- Campos: id (UUID), contract_id (UUID FK a contracts), nombre_pago (VARCHAR), valor (NUMERIC), fecha_cobro (DATE), estado_pago_id (UUID FK a estados_pagos), created_at, updated_at
-- Descripción: Cuotas de pago asociadas a un contrato
-- RELACIONES:
--   - contract_id -> contracts.id (el contrato al que pertenece)
--   - estado_pago_id -> estados_pagos.id (estado del pago)
-- IMPORTANTE PARA CONSULTAS DE DINERO ADEUDADO:
--   - Si estado_pago.name != 'Pagado', entonces la cuota está pendiente
--   - Para calcular dinero adeudado: SUM(installments.valor) WHERE estado_pago.name != 'Pagado'
--   - Para contar cuotas pendientes: COUNT(*) WHERE estado_pago.name != 'Pagado'

-- Tabla: estados_pagos
-- Campos: id (UUID), name (VARCHAR), cliente_id (UUID FK a clientes), created_at
-- Valores comunes: 'Registrado', 'Radicado en cliente', 'Pagado'
-- IMPORTANTE:
--   - 'Pagado' = la cuota ya fue pagada
--   - Cualquier otro estado ('Registrado', 'Radicado en cliente', etc.) = la cuota está pendiente de pago
--   - Para consultas de dinero adeudado, filtrar por: estados_pagos.name != 'Pagado' o estados_pagos.name <> 'Pagado'

-- Tabla: tipos_contratos
-- Campos: id (UUID), name (VARCHAR), cliente_id (UUID FK a clientes), created_at

-- Tabla: estados_contratos
-- Campos: id (UUID), name (VARCHAR), cliente_id (UUID FK a clientes), created_at

-- Tabla: tipos_documentos
-- Campos: id (UUID), name (VARCHAR), cliente_id (UUID FK a clientes), created_at

-- Tabla: attachments (documentos adjuntos a contratos)
-- Campos: id (UUID), contract_id (UUID FK a contracts), tipo_documento_id (UUID FK), archivo (TEXT - URL), observaciones (TEXT), fecha_upload (TIMESTAMP), usuario_upload (UUID FK a usuarios), created_at

-- Tabla: tipos_actividades
-- Campos: id (UUID), name (VARCHAR), cliente_id (UUID FK a clientes), created_at

-- Tabla: productos
-- Campos: id (UUID), name (VARCHAR), cliente_id (UUID FK a clientes), created_at

-- Tabla: estados_obligaciones
-- Campos: id (UUID), name (VARCHAR), cliente_id (UUID FK a clientes), created_at

-- Tabla: obligations (obligaciones de contratos)
-- Campos: id (UUID), contract_id (UUID FK a contracts), tipo_actividad_id (UUID FK), producto_id (UUID FK), descripcion (TEXT), responsable_id (UUID FK a usuarios), estado_obligacion_id (UUID FK), created_at, updated_at

-- =====================================================
-- EJEMPLOS DE CONSULTAS COMUNES
-- =====================================================

-- 1. Dinero adeudado (suma de cuotas no pagadas):
-- SELECT SUM(i.valor) as total_adeudado
-- FROM installments i
-- INNER JOIN contracts c ON i.contract_id = c.id
-- INNER JOIN estados_pagos ep ON i.estado_pago_id = ep.id
-- WHERE c.cliente_id = '[cliente_id]' AND ep.name != 'Pagado'

-- 2. Cuotas pendientes con detalle de contrato y cliente:
-- SELECT 
--   c.numero_contrato,
--   COALESCE(cl.razon_social, CONCAT(cl.nombre1, ' ', cl.apellido1)) as nombre_cliente,
--   i.nombre_pago,
--   i.valor,
--   i.fecha_cobro,
--   ep.name as estado_pago
-- FROM installments i
-- INNER JOIN contracts c ON i.contract_id = c.id
-- INNER JOIN clients cl ON c.client_id = cl.id
-- INNER JOIN estados_pagos ep ON i.estado_pago_id = ep.id
-- WHERE c.cliente_id = '[cliente_id]' AND ep.name != 'Pagado'

-- 3. Contar cuotas pendientes:
-- SELECT COUNT(*) as cantidad_cuotas_pendientes
-- FROM installments i
-- INNER JOIN contracts c ON i.contract_id = c.id
-- INNER JOIN estados_pagos ep ON i.estado_pago_id = ep.id
-- WHERE c.cliente_id = '[cliente_id]' AND ep.name != 'Pagado'

-- =====================================================
-- REGLAS IMPORTANTES
-- =====================================================

-- 1. SIEMPRE filtrar por cliente_id en tablas que lo tengan (clientes, usuarios, contracts, clients, installments, etc.)
-- 2. Para consultas de dinero adeudado, usar: estados_pagos.name != 'Pagado' o estados_pagos.name <> 'Pagado'
-- 3. Para obtener nombre de cliente (contratante):
--    - Si tipo = 'juridica': usar razon_social
--    - Si tipo = 'natural': usar CONCAT(nombre1, ' ', apellido1)
-- 4. Las cuotas de pago (installments) están relacionadas con contratos (contracts) a través de contract_id
-- 5. Los contratos están relacionados con clientes/contratantes (clients) a través de client_id
-- 6. El estado de pago se obtiene de estados_pagos a través de estado_pago_id en installments
`

/**
 * Generar SQL a partir de una pregunta en lenguaje natural
 * @param {string} question - Pregunta del usuario
 * @param {string} clienteId - ID del cliente/tenant para filtrar
 * @param {string} conversationContext - Contexto de la conversación anterior
 * @returns {Promise<{sql: string, explanation: string}>}
 */
export async function generateSQL(question, clienteId, conversationContext = '') {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno')
  }

  const systemPrompt = `Eres un experto en PostgreSQL y generación de consultas SQL. 
Tu tarea es convertir preguntas en lenguaje natural (español) a consultas SQL válidas para PostgreSQL.

REGLAS CRÍTICAS:
1. SIEMPRE debes filtrar por cliente_id = '${clienteId}' en todas las tablas que tengan este campo
2. Las tablas con cliente_id son: clientes, usuarios, calculos, tipos_identificacion, clients, tipos_contratos, estados_contratos, contracts, tipos_documentos, estados_pagos, tipos_actividades, productos, estados_obligaciones
3. NO uses JOINs innecesarios, usa las relaciones de Supabase cuando sea posible
4. Para fechas, usa formato DATE: 'YYYY-MM-DD'
5. Para meses, extrae el año actual y el mes mencionado
6. Para valores monetarios, usa NUMERIC y compara correctamente
7. Para búsquedas de texto, usa ILIKE con % para coincidencias parciales
8. NO generes consultas que modifiquen datos (INSERT, UPDATE, DELETE), solo SELECT
9. Si la pregunta requiere contar, usa COUNT(*)
10. Si la pregunta requiere sumar, usa SUM()
11. Si la pregunta requiere promedios, usa AVG()
12. Limita los resultados a un máximo razonable (ej: LIMIT 50)

REGLAS ESPECIALES PARA CONSULTAS DE PAGOS Y DINERO ADEUDADO:
- Cuando el usuario pregunte sobre "dinero adeudado", "cuentas pendientes", "cuotas no pagadas", "lo que nos deben", etc.:
  * Debes hacer JOIN entre installments, contracts, clients y estados_pagos
  * Filtrar por estados_pagos.name != 'Pagado' o estados_pagos.name <> 'Pagado'
  * Sumar el valor de las cuotas: SUM(installments.valor)
  * Incluir información del contrato (numero_contrato) y del cliente/contratante (nombre)
  
- Cuando el usuario pregunte sobre "cuántas cuentas/cuotas pendientes":
  * Usa COUNT(*) con el mismo filtro de estados_pagos.name != 'Pagado'
  * Incluye JOINs necesarios para obtener contexto (contrato, cliente)
  
- Cuando el usuario pida "detalle de cuentas pendientes":
  * Incluye: numero_contrato, nombre del cliente (COALESCE(razon_social, CONCAT(nombre1, ' ', apellido1))), nombre_pago, valor, fecha_cobro, estado_pago
  * Usa los JOINs: installments -> contracts -> clients -> estados_pagos

- Para obtener el nombre del cliente/contratante:
  * Si clients.tipo = 'juridica': usar clients.razon_social
  * Si clients.tipo = 'natural': usar CONCAT(clients.nombre1, ' ', clients.apellido1)
  * O usar: COALESCE(clients.razon_social, CONCAT(clients.nombre1, ' ', clients.apellido1))

- Relaciones importantes:
  * installments.contract_id -> contracts.id
  * contracts.client_id -> clients.id
  * installments.estado_pago_id -> estados_pagos.id
  * contracts.cliente_id -> clientes.id (para multi-tenancy)

Responde SOLO con un objeto JSON válido en este formato:
{
  "sql": "SELECT ... WHERE cliente_id = '${clienteId}' ...",
  "explanation": "Breve explicación de lo que hace la consulta"
}`

  // Construir prompt con contexto
  let contextInfo = ''
  if (conversationContext) {
    contextInfo = `\n\nCONTEXTO DE LA CONVERSACIÓN ANTERIOR:\n${conversationContext}\n\nIMPORTANTE: Si la pregunta hace referencia a algo mencionado anteriormente (como "ellos", "esos", "los anteriores", etc.), usa el contexto para entender a qué se refiere. Por ejemplo, si anteriormente se preguntó "¿cuántos clientes hay?" y ahora pregunta "dame información de ellos", debes hacer un SELECT de la tabla clients.`
  }

  const userPrompt = `Pregunta del usuario: "${question}"${contextInfo}

Genera una consulta SQL que responda esta pregunta. Recuerda:
- Filtrar por cliente_id = '${clienteId}' en todas las tablas relevantes
- Usar nombres de tablas y columnas exactos del esquema
- Generar SQL válido para PostgreSQL
- Incluir JOINs necesarios para relaciones entre tablas
- Si la pregunta hace referencia a algo mencionado antes, usa el contexto para entenderla

INTERPRETACIÓN DE PREGUNTAS COMUNES:
- "¿Cuánto dinero nos deben?" / "¿Cuánto nos adeudan?" → SUM(installments.valor) WHERE estados_pagos.name != 'Pagado'
- "¿Cuántas cuentas pendientes?" / "¿Cuántas cuotas no pagadas?" → COUNT(*) de installments WHERE estados_pagos.name != 'Pagado'
- "Dame el detalle de las cuentas pendientes" → SELECT con numero_contrato, nombre_cliente, nombre_pago, valor, fecha_cobro, estado_pago
- "Dame información de esa cuenta" (referencia a cuota pendiente) → SELECT detallado de installments con JOINs a contracts y clients
- "Valor total de cuentas adeudadas" → SUM(installments.valor) con filtro de estado != 'Pagado'

IMPORTANTE: 
- Para consultas sobre dinero adeudado, SIEMPRE debes hacer JOIN con estados_pagos y filtrar por name != 'Pagado'
- Incluye información del contrato (numero_contrato) y del cliente/contratante (nombre) cuando sea relevante
- Usa COALESCE(razon_social, CONCAT(nombre1, ' ', apellido1)) para obtener el nombre del cliente`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modelo más económico, puedes cambiar a 'gpt-4' si necesitas más precisión
      messages: [
        {
          role: 'system',
          content: systemPrompt + '\n\n' + DATABASE_SCHEMA
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3, // Baja temperatura para SQL más consistente
      response_format: { type: 'json_object' }
    })

    const response = JSON.parse(completion.choices[0].message.content)
    
    // Validar que el SQL generado incluya el filtro de cliente_id
    if (!response.sql.toLowerCase().includes(`cliente_id = '${clienteId}'`.toLowerCase()) && 
        !response.sql.toLowerCase().includes(`cliente_id='${clienteId}'`.toLowerCase()) &&
        !response.sql.toLowerCase().includes(`.cliente_id = '${clienteId}'`.toLowerCase())) {
      // Si no tiene el filtro, agregarlo
      if (response.sql.toUpperCase().includes('WHERE')) {
        response.sql = response.sql.replace(/WHERE/i, `WHERE cliente_id = '${clienteId}' AND`)
      } else {
        // Agregar WHERE si no existe
        const selectMatch = response.sql.match(/SELECT.*FROM\s+(\w+)/i)
        if (selectMatch) {
          const tableName = selectMatch[1]
          response.sql = response.sql.replace(/FROM\s+\w+/i, `FROM ${tableName} WHERE ${tableName}.cliente_id = '${clienteId}'`)
        }
      }
    }

    // Validar que no tenga comandos peligrosos
    const dangerousKeywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'CREATE', 'TRUNCATE']
    const upperSQL = response.sql.toUpperCase()
    for (const keyword of dangerousKeywords) {
      if (upperSQL.includes(keyword)) {
        throw new Error(`La consulta generada contiene comandos no permitidos: ${keyword}`)
      }
    }

    return {
      sql: response.sql,
      explanation: response.explanation || 'Consulta generada automáticamente'
    }
  } catch (error) {
    if (error.message.includes('no está configurada')) {
      throw error
    }
    throw new Error(`Error al generar SQL: ${error.message}`)
  }
}

