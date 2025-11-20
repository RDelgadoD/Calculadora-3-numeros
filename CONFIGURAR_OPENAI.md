# Configuración de OpenAI para Chat de Consultas

## 📋 Pasos para Configurar

### 1. Obtener API Key de OpenAI

1. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Inicia sesión o crea una cuenta
3. Haz clic en "Create new secret key"
4. Copia la clave (solo se muestra una vez)

### 2. Agregar Variable de Entorno

Abre el archivo `backend/.env` y agrega:

```env
OPENAI_API_KEY=sk-tu-api-key-aqui
```

**Importante**: Reemplaza `sk-tu-api-key-aqui` con tu API key real.

### 3. Crear Función RPC en PostgreSQL (Opcional pero Recomendado)

Para consultas SQL más complejas, ejecuta el script `crear-funcion-rpc-sql-seguro.sql` en el SQL Editor de Supabase:

1. Ve a Supabase > **SQL Editor**
2. Abre el archivo `crear-funcion-rpc-sql-seguro.sql`
3. Copia y pega el contenido
4. Ejecuta el script (Run o Ctrl+Enter)

Esta función permite ejecutar consultas SQL de forma segura, validando que:
- Solo sean consultas SELECT
- Incluyan el filtro de cliente_id para multi-tenancy
- No contengan comandos peligrosos (DROP, DELETE, etc.)

### 4. Reiniciar el Backend

Después de agregar la variable de entorno, reinicia el servidor backend:

```bash
# Detener el servidor actual (Ctrl+C)
# Luego reiniciar
cd backend
npm run dev
```

## 🎯 Uso del Chat

Una vez configurado, el chat puede responder preguntas como:

- "¿Cuántos contratos mayores a 40,000,000 se firmaron en febrero?"
- "¿Cuántos contratos se han firmado con Syp Solutions?"
- "¿Cuál es el valor total de los contratos activos?"
- "Listar todos los usuarios del sistema"
- "¿Cuántas cuotas de pago están pendientes?"
- "Mostrar los contratos con fecha de inicio en 2024"

## 💰 Costos de OpenAI

El sistema usa `gpt-4o-mini` que es el modelo más económico:
- **Costo aproximado**: $0.15 por 1M tokens de entrada, $0.60 por 1M tokens de salida
- **Uso típico**: ~500-1000 tokens por consulta
- **Costo por consulta**: ~$0.0005 - $0.001

## 🔒 Seguridad

- Todas las consultas se filtran automáticamente por `cliente_id` del usuario
- Solo se permiten consultas SELECT (no modificaciones)
- Se valida que no contengan comandos peligrosos
- El SQL generado se valida antes de ejecutarse

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY no está configurada"
- Verifica que el archivo `backend/.env` tenga la variable
- Reinicia el servidor backend después de agregarla

### Error: "Error al generar SQL"
- Verifica que tu API key sea válida
- Revisa que tengas créditos en tu cuenta de OpenAI
- Revisa los logs del backend para más detalles

### Error: "Se requiere crear función PostgreSQL execute_safe_select"
- Ejecuta el script `crear-funcion-rpc-sql-seguro.sql` en Supabase
- Esto mejora el soporte para consultas complejas

