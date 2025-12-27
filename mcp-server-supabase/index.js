#!/usr/bin/env node

/**
 * Servidor MCP personalizado para Supabase
 * Permite operaciones CRUD en la base de datos a través del Model Context Protocol
 * 
 * NOTA: Este servidor requiere @modelcontextprotocol/sdk
 * Instalar con: npm install @modelcontextprotocol/sdk
 */

import { createClient } from '@supabase/supabase-js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

// Obtener credenciales de Supabase desde variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY deben estar configuradas')
  process.exit(1)
}

// Inicializar cliente de Supabase con service_role (bypass RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Crear servidor MCP
const server = new Server(
  {
    name: 'supabase-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Listar herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_tables',
        description: 'Lista todas las tablas de la base de datos Supabase',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'query_table',
        description: 'Ejecuta una consulta SELECT en una tabla específica',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Nombre de la tabla',
            },
            limit: {
              type: 'number',
              description: 'Límite de registros a retornar (default: 100)',
              default: 100,
            },
            filters: {
              type: 'object',
              description: 'Filtros opcionales (ej: { column: "id", operator: "eq", value: 1 })',
            },
          },
          required: ['table'],
        },
      },
      {
        name: 'insert_record',
        description: 'Inserta un nuevo registro en una tabla',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Nombre de la tabla',
            },
            data: {
              type: 'object',
              description: 'Datos a insertar',
            },
          },
          required: ['table', 'data'],
        },
      },
      {
        name: 'update_record',
        description: 'Actualiza un registro existente en una tabla',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Nombre de la tabla',
            },
            id: {
              type: 'string',
              description: 'ID del registro a actualizar',
            },
            data: {
              type: 'object',
              description: 'Datos a actualizar',
            },
          },
          required: ['table', 'id', 'data'],
        },
      },
      {
        name: 'delete_record',
        description: 'Elimina un registro de una tabla',
        inputSchema: {
          type: 'object',
          properties: {
            table: {
              type: 'string',
              description: 'Nombre de la tabla',
            },
            id: {
              type: 'string',
              description: 'ID del registro a eliminar',
            },
          },
          required: ['table', 'id'],
        },
      },
      {
        name: 'execute_sql',
        description: 'Ejecuta una consulta SQL personalizada (solo SELECT)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Consulta SQL a ejecutar',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'create_table',
        description: 'Crea una nueva tabla en la base de datos',
        inputSchema: {
          type: 'object',
          properties: {
            table_name: {
              type: 'string',
              description: 'Nombre de la tabla a crear',
            },
            columns_def: {
              type: 'string',
              description: 'Definición de columnas en formato SQL (ej: "id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre text NOT NULL, created_at timestamptz DEFAULT now()")',
            },
          },
          required: ['table_name', 'columns_def'],
        },
      },
      {
        name: 'add_column',
        description: 'Agrega una columna a una tabla existente',
        inputSchema: {
          type: 'object',
          properties: {
            table_name: {
              type: 'string',
              description: 'Nombre de la tabla',
            },
            column_name: {
              type: 'string',
              description: 'Nombre de la columna a agregar',
            },
            column_type: {
              type: 'string',
              description: 'Tipo de dato de la columna (ej: text, integer, uuid, timestamptz)',
            },
            column_default: {
              type: 'string',
              description: 'Valor por defecto (opcional)',
            },
            is_nullable: {
              type: 'boolean',
              description: 'Si la columna permite NULL (default: true)',
              default: true,
            },
          },
          required: ['table_name', 'column_name', 'column_type'],
        },
      },
    ],
  }
})

// Manejar llamadas a herramientas
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'list_tables': {
        // Intentar usar una función RPC personalizada si existe
        try {
          const { data, error } = await supabase.rpc('get_tables')
          
          if (!error && data) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(data, null, 2),
                },
              ],
            }
          }
        } catch (rpcError) {
          // Continuar con método alternativo
        }

        // Método alternativo: ejecutar SQL directamente usando rpc('exec_sql')
        const sqlQuery = `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `

        try {
          const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
            query: sqlQuery
          })

          if (!sqlError && sqlData) {
            const tableNames = Array.isArray(sqlData) 
              ? sqlData.map(row => row.table_name || row.table_name)
              : []
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(tableNames, null, 2),
                },
              ],
            }
          }

          // Si exec_sql no existe, sugerir usar execute_sql tool
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  message: 'La función RPC exec_sql no está disponible. Usa la herramienta execute_sql con esta consulta:',
                  query: sqlQuery.trim()
                }, null, 2),
              },
            ],
          }
        } catch (error) {
          throw new Error(`Error al listar tablas: ${error.message}`)
        }
      }

      case 'query_table': {
        const { table, limit = 100, filters } = args
        let query = supabase.from(table).select('*').limit(limit)

        // Aplicar filtros si existen
        if (filters) {
          const { column, operator, value } = filters
          if (column && operator && value !== undefined) {
            query = query[operator](column, value)
          }
        }

        const { data, error } = await query

        if (error) {
          throw new Error(`Error al consultar tabla ${table}: ${error.message}`)
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data || [], null, 2),
            },
          ],
        }
      }

      case 'insert_record': {
        const { table, data } = args
        const { data: result, error } = await supabase
          .from(table)
          .insert(data)
          .select()

        if (error) {
          throw new Error(`Error al insertar en ${table}: ${error.message}`)
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result || [], null, 2),
            },
          ],
        }
      }

      case 'update_record': {
        const { table, id, data } = args
        const { data: result, error } = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select()

        if (error) {
          throw new Error(`Error al actualizar ${table}: ${error.message}`)
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result || [], null, 2),
            },
          ],
        }
      }

      case 'delete_record': {
        const { table, id } = args
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id)

        if (error) {
          throw new Error(`Error al eliminar de ${table}: ${error.message}`)
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, message: `Registro ${id} eliminado de ${table}` }, null, 2),
            },
          ],
        }
      }

      case 'execute_sql': {
        const { query } = args

        // Validar que solo sea SELECT por seguridad
        if (!query.trim().toUpperCase().startsWith('SELECT')) {
          throw new Error('Solo se permiten consultas SELECT por seguridad')
        }

        // Ejecutar SQL usando rpc o directamente
        const { data, error } = await supabase.rpc('exec_sql', { query })

        if (error) {
          throw new Error(`Error al ejecutar SQL: ${error.message}`)
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data || [], null, 2),
            },
          ],
        }
      }

      case 'create_table': {
        const { table_name, columns_def } = args

        // Llamar a la función RPC create_table
        const { data, error } = await supabase.rpc('create_table', {
          table_name,
          columns_def
        })

        if (error) {
          throw new Error(`Error al crear tabla ${table_name}: ${error.message}`)
        }

        // Verificar si la función retornó un error
        if (data && typeof data === 'object' && data.error) {
          throw new Error(`Error al crear tabla: ${data.error}`)
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data || { success: true, message: `Tabla ${table_name} creada exitosamente` }, null, 2),
            },
          ],
        }
      }

      case 'add_column': {
        const { table_name, column_name, column_type, column_default, is_nullable = true } = args

        // Llamar a la función RPC add_column_to_table
        const { data, error } = await supabase.rpc('add_column_to_table', {
          table_name,
          column_name,
          column_type,
          column_default: column_default || null,
          is_nullable
        })

        if (error) {
          throw new Error(`Error al agregar columna ${column_name} a ${table_name}: ${error.message}`)
        }

        // Verificar si la función retornó un error
        if (data && typeof data === 'object' && data.error) {
          throw new Error(`Error al agregar columna: ${data.error}`)
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data || { success: true, message: `Columna ${column_name} agregada a ${table_name}` }, null, 2),
            },
          ],
        }
      }

      default:
        throw new Error(`Herramienta desconocida: ${name}`)
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    }
  }
})

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('✅ Servidor MCP de Supabase iniciado')
}

main().catch(console.error)

