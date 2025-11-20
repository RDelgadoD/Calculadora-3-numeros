# Solución: Consultar Contratos desde Postman

## Problema
La consulta GET a `/rest/v1/contracts` devuelve `200 OK` pero un array vacío `[]`, aunque existen contratos en la base de datos.

## Causa
Las políticas **RLS (Row Level Security)** están bloqueando el acceso porque:
1. La API REST de Supabase requiere un **token JWT válido** de un usuario autenticado
2. El usuario debe existir en la tabla `usuarios` con un `cliente_id` asignado
3. Los contratos deben tener el mismo `cliente_id` que el usuario

## Soluciones

### Opción 1: Usar Token JWT Válido (RECOMENDADO)

#### Paso 1: Obtener Token JWT desde tu aplicación

1. Abre tu aplicación en el navegador
2. Inicia sesión con un usuario válido
3. Abre las **DevTools** (F12)
4. Ve a la pestaña **Application** (Chrome) o **Storage** (Firefox)
5. Busca **Local Storage** > tu dominio
6. Busca la clave `sb-[proyecto]-auth-token`
7. Copia el valor del token JWT

#### Paso 2: Usar el Token en Postman

1. En Postman, ve a la pestaña **Authorization**
2. Selecciona tipo: **Bearer Token**
3. Pega el token JWT que copiaste
4. También agrega en **Headers**:
   - `apikey`: Tu `anon public key` de Supabase
   - `Authorization`: `Bearer [tu-token-jwt]`

#### Paso 3: Verificar que el Usuario Existe

Ejecuta en Supabase SQL Editor:

```sql
-- Verificar que tu usuario tiene cliente_id
SELECT 
  u.id,
  u.email,
  u.cliente_id,
  u.rol,
  c.nombre as cliente_nombre
FROM usuarios u
LEFT JOIN clientes c ON c.id = u.cliente_id
WHERE u.email = 'tu-email@ejemplo.com';
```

### Opción 2: Obtener Token JWT desde Supabase Auth API

#### Paso 1: Login via API

En Postman, crea una nueva request:

**POST** `https://[tu-proyecto].supabase.co/auth/v1/token?grant_type=password`

**Headers:**
```
apikey: [tu-anon-key]
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "tu-email@ejemplo.com",
  "password": "tu-contraseña"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  ...
}
```

#### Paso 2: Usar el access_token

Copia el `access_token` del response y úsalo en el header `Authorization: Bearer [access_token]`

### Opción 3: Usar Service Role Key (SOLO PARA DESARROLLO)

⚠️ **ADVERTENCIA**: Esta opción **bypasea RLS** y es solo para desarrollo/testing.

1. En Postman, en **Headers**, agrega:
   - `apikey`: Tu `service_role key` (NO la anon key)
   - `Authorization`: `Bearer [service_role_key]`

2. Esto te permitirá ver todos los contratos sin restricciones RLS

### Opción 4: Verificar y Corregir Datos

Ejecuta el script `verificar-rls-contratos.sql` en Supabase SQL Editor para diagnosticar:

1. Verificar que los contratos tienen `cliente_id` válido
2. Verificar que el usuario tiene `cliente_id` asignado
3. Verificar que coinciden los `cliente_id`

## Headers Correctos para Postman

```
apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon public key)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (JWT token del usuario)
Content-Type: application/json
Prefer: return=representation
```

## Ejemplo de Request Completo

**GET** `https://[tu-proyecto].supabase.co/rest/v1/contracts?select=*`

**Headers:**
```
apikey: [tu-anon-key]
Authorization: Bearer [jwt-token-del-usuario]
Content-Type: application/json
```

**Query Params (opcionales):**
```
select: *
cliente_id: eq.[uuid-del-cliente]
```

## Verificar Políticas RLS

Ejecuta en Supabase SQL Editor:

```sql
-- Ver políticas de contracts
SELECT 
  policyname,
  cmd as operacion,
  qual as condicion
FROM pg_policies
WHERE tablename = 'contracts';
```

La política `contracts_select_mine` requiere:
- Usuario autenticado (`TO authenticated`)
- Que `cliente_id` del contrato coincida con `cliente_id` del usuario
- O que el usuario sea admin

## Solución Rápida para Testing

Si solo necesitas probar la API temporalmente:

```sql
-- Crear política temporal para testing (ELIMINAR DESPUÉS)
CREATE POLICY IF NOT EXISTS contracts_select_test
  ON contracts FOR SELECT
  TO authenticated
  USING (true);
```

**IMPORTANTE**: Elimina esta política después de probar:
```sql
DROP POLICY IF EXISTS contracts_select_test ON contracts;
```

