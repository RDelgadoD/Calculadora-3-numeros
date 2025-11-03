# Calculadora de 3 Números

Una aplicación React moderna que permite ingresar 3 números y realizar diferentes operaciones matemáticas con ellos. Los cálculos se guardan automáticamente en Supabase.

## Características

- Interfaz moderna y atractiva
- Ingreso de 3 números
- Selección de operación matemática:
  - Suma
  - Resta
  - Multiplicación
  - División
  - Promedio
  - Máximo
  - Mínimo
- Visualización del resultado en tiempo real
- **Sistema de autenticación**: Login y registro de usuarios
- **Acceso protegido**: Solo usuarios autenticados pueden usar la calculadora
- **Guardado automático en Supabase**: Todos los cálculos se guardan en una base de datos asociados al usuario

## Instalación

1. Instala las dependencias:
```bash
npm install
```

2. **Configura Supabase:**
   - Crea una cuenta en [Supabase](https://app.supabase.com) si no tienes una
   - Crea un nuevo proyecto
   - Ve a **SQL Editor** en el panel lateral
   - Copia y pega el contenido del archivo `supabase-setup.sql`
   - Ejecuta el script para crear la tabla `calculos`
   - Ve a **Settings > API** y copia:
     - La **URL del proyecto**
     - La **anon/public key**

3. **Configura las variables de entorno:**
   - Crea un archivo `.env` en la raíz del proyecto
   - Agrega las siguientes variables:
   ```
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anon
   ```

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

5. Abre tu navegador en la URL que se muestra (generalmente http://localhost:5173)

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la build de producción

## Tecnologías Utilizadas

- React 18
- Vite
- Supabase (Base de datos)
- CSS3 (con animaciones y gradientes)

## Autenticación

La aplicación requiere autenticación para acceder a la calculadora:

1. **Registro**: Los usuarios pueden crear una cuenta nueva con email y contraseña
2. **Login**: Los usuarios pueden iniciar sesión con sus credenciales
3. **Sesión persistente**: La sesión se mantiene al recargar la página
4. **Logout**: Botón para cerrar sesión disponible en la interfaz

## Estructura de la Base de Datos

La tabla `calculos` almacena:
- `id`: UUID único para cada cálculo
- `user_id`: ID del usuario que realizó el cálculo (referencia a auth.users)
- `numero1`, `numero2`, `numero3`: Los tres números ingresados
- `operacion`: El tipo de operación realizada
- `resultado`: El resultado del cálculo
- `created_at`: Timestamp de cuando se guardó el cálculo

**Seguridad**: Los usuarios solo pueden ver y crear sus propios cálculos gracias a las políticas Row Level Security (RLS) de Supabase.
