/**
 * Script para ejecutar la asignación de cliente por defecto
 * Ejecutar con: node ejecutar-setup-cliente.js
 */

import dotenv from 'dotenv'
import { supabaseAdmin } from './backend/lib/supabase.js'

dotenv.config()

async function asignarClienteDefault() {
  try {
    console.log('🔧 Iniciando asignación de cliente por defecto...\n')

    // 1. Verificar si existe un cliente por defecto
    console.log('1. Verificando cliente por defecto...')
    let { data: clienteDefault, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nombre')
      .eq('nombre', 'OT Piendamo Cauca')
      .limit(1)
      .single()

    // 2. Si no existe, crearlo
    if (clienteError || !clienteDefault) {
      console.log('   Cliente no existe. Creándolo...')
      const { data: nuevoCliente, error: createError } = await supabaseAdmin
        .from('clientes')
        .insert([
          {
            nombre: 'OT Piendamo Cauca',
            activo: true
          }
        ])
        .select()
        .single()

      if (createError) {
        throw createError
      }

      clienteDefault = nuevoCliente
      console.log(`   ✅ Cliente creado: ${nuevoCliente.nombre} (${nuevoCliente.id})`)
    } else {
      console.log(`   ✅ Cliente encontrado: ${clienteDefault.nombre} (${clienteDefault.id})`)
    }

    // 3. Obtener usuarios sin cliente
    console.log('\n2. Buscando usuarios sin cliente...')
    const { data: usuariosSinCliente, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, nombre_completo, cliente_id')
      .is('cliente_id', null)

    if (usuariosError) {
      throw usuariosError
    }

    if (!usuariosSinCliente || usuariosSinCliente.length === 0) {
      console.log('   ℹ️  No hay usuarios sin cliente asignado.')
    } else {
      console.log(`   Encontrados ${usuariosSinCliente.length} usuarios sin cliente:`)
      usuariosSinCliente.forEach(usuario => {
        console.log(`   - ${usuario.email || usuario.nombre_completo || usuario.id}`)
      })
    }

    // 4. Asignar el cliente a los usuarios sin cliente
    if (usuariosSinCliente && usuariosSinCliente.length > 0) {
      console.log('\n3. Asignando cliente a usuarios...')
      const { error: updateError, count } = await supabaseAdmin
        .from('usuarios')
        .update({ cliente_id: clienteDefault.id })
        .is('cliente_id', null)
        .eq('activo', true)
        .select()

      if (updateError) {
        throw updateError
      }

      console.log(`   ✅ Cliente asignado a ${usuariosSinCliente.length} usuario(s)`)
    } else {
      console.log('\n3. No hay usuarios para actualizar.')
    }

    // 5. Verificar resultado final
    console.log('\n4. Verificando resultado...')
    const { data: usuariosFinales, error: finalError } = await supabaseAdmin
      .from('usuarios')
      .select(`
        id,
        email,
        nombre_completo,
        cliente_id,
        clientes (
          id,
          nombre
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (finalError) {
      throw finalError
    }

    console.log('\n📊 Resumen:')
    console.log(`   - Cliente: ${clienteDefault.nombre}`)
    console.log(`   - Usuarios actualizados: ${usuariosSinCliente?.length || 0}`)
    console.log('\n   Últimos usuarios:')
    usuariosFinales?.forEach(usuario => {
      const clienteNombre = usuario.clientes?.nombre || 'Sin cliente'
      console.log(`   - ${usuario.email || usuario.nombre_completo || usuario.id}: ${clienteNombre}`)
    })

    console.log('\n✅ Proceso completado exitosamente!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Error al asignar cliente por defecto:')
    console.error('   Código:', error.code)
    console.error('   Mensaje:', error.message)
    console.error('   Detalles:', error.details)
    console.error('\n   Error completo:', error)
    process.exit(1)
  }
}

asignarClienteDefault()

