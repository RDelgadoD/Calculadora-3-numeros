# Instrucciones para Configurar Supabase

## Paso 1: Crear un Proyecto en Supabase

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión o crea una cuenta nueva
3. Haz clic en "New Project"
4. Completa la información del proyecto:
   - **Name**: Elige un nombre para tu proyecto
   - **Database Password**: Crea una contraseña segura (guárdala en un lugar seguro)
   - **Region**: Selecciona la región más cercana
5. Haz clic en "Create new project"

## Paso 2: Habilitar Autenticación

La autenticación ya está habilitada por defecto en Supabase. No necesitas hacer nada adicional.

## Paso 3: Crear la Tabla

1. En el panel lateral izquierdo, haz clic en **SQL Editor**
2. Haz clic en "New query"
3. Abre el archivo `supabase-setup.sql` de este proyecto
4. Copia todo el contenido del archivo
5. Pégalo en el SQL Editor de Supabase
6. Haz clic en "Run" (o presiona Ctrl+Enter)
7. Deberías ver un mensaje de éxito confirmando que la tabla se creó

**IMPORTANTE**: Si ya tenías la tabla `calculos` creada antes de agregar autenticación, ejecuta también el archivo `supabase-update-auth.sql` para actualizar la tabla con el campo `user_id` y las nuevas políticas de seguridad.

## Paso 4: Obtener las Credenciales

1. En el panel lateral izquierdo, haz clic en **Settings** (⚙️)
2. Selecciona **API** en el menú de configuración
3. Encontrarás dos valores importantes:
   - **Project URL**: Esta es tu `VITE_SUPABASE_URL`
   - **anon public key**: Esta es tu `VITE_SUPABASE_ANON_KEY`

## Paso 5: Configurar las Variables de Entorno

1. En la raíz de tu proyecto, crea un archivo llamado `.env`
2. Agrega las siguientes líneas (reemplaza con tus valores reales):

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-aqui
```

**Importante**: No subas el archivo `.env` a Git. Ya está incluido en `.gitignore`.

## Paso 6: Verificar que Funciona

1. Reinicia el servidor de desarrollo si estaba corriendo:
   ```bash
   npm run dev
   ```
2. Abre la aplicación en el navegador
3. **Primero, deberás registrarte o iniciar sesión:**
   - Si no tienes cuenta, haz clic en "Regístrate" y crea una cuenta nueva
   - Si ya tienes cuenta, inicia sesión con tu email y contraseña
4. Una vez autenticado, verás la interfaz de la calculadora
5. Ingresa 3 números, selecciona una operación y haz clic en "Calcular"
6. Deberías ver un mensaje verde que dice "✓ Cálculo guardado exitosamente"
7. Para verificar que se guardó, ve a Supabase:
   - En el panel lateral, haz clic en **Table Editor**
   - Selecciona la tabla `calculos`
   - Deberías ver los registros guardados (solo los tuyos si estás logueado)

## Solución de Problemas

### Error: "Failed to fetch" o "Network error"
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que el archivo `.env` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo después de crear o modificar `.env`

### Error: "relation 'calculos' does not exist"
- Asegúrate de haber ejecutado el script SQL correctamente
- Verifica en Supabase > Table Editor que la tabla `calculos` existe

### Error: "new row violates row-level security policy"
- Verifica que ejecutaste todas las políticas en el script SQL
- Asegúrate de estar autenticado en la aplicación antes de intentar guardar cálculos
- Verifica que el campo `user_id` existe en la tabla (ejecuta `supabase-update-auth.sql` si no lo has hecho)

### No puedo iniciar sesión o registrarme
- Verifica que las credenciales de Supabase en `.env` sean correctas
- Asegúrate de que la autenticación esté habilitada en Supabase (debería estar por defecto)
- Revisa la consola del navegador (F12) para ver errores detallados

### No se muestra el mensaje de éxito
- Abre la consola del navegador (F12) para ver errores detallados
- Verifica que las variables de entorno estén correctamente configuradas
