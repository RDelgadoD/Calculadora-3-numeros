-- Políticas RLS para la tabla descuentos_productos_config
-- Estas políticas permiten que los usuarios solo vean y modifiquen
-- descuentos de su propio cliente (tenant)

-- ===========================================
-- POLÍTICA: SELECT (Leer descuentos)
-- ===========================================
-- Los usuarios solo pueden ver descuentos de su cliente
CREATE POLICY "select_descuentos_por_cliente"
ON public.descuentos_productos_config
FOR SELECT
USING (
  cliente_id IN (
    SELECT cliente_id 
    FROM public.usuarios 
    WHERE id = auth.uid()
  )
);

-- ===========================================
-- POLÍTICA: INSERT (Crear descuentos)
-- ===========================================
-- Los usuarios solo pueden crear descuentos para su cliente
CREATE POLICY "insert_descuentos_por_cliente"
ON public.descuentos_productos_config
FOR INSERT
WITH CHECK (
  cliente_id IN (
    SELECT cliente_id 
    FROM public.usuarios 
    WHERE id = auth.uid()
  )
);

-- ===========================================
-- POLÍTICA: UPDATE (Actualizar descuentos)
-- ===========================================
-- Los usuarios solo pueden actualizar descuentos de su cliente
CREATE POLICY "update_descuentos_por_cliente"
ON public.descuentos_productos_config
FOR UPDATE
USING (
  cliente_id IN (
    SELECT cliente_id 
    FROM public.usuarios 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  cliente_id IN (
    SELECT cliente_id 
    FROM public.usuarios 
    WHERE id = auth.uid()
  )
);

-- ===========================================
-- POLÍTICA: DELETE (Eliminar descuentos)
-- ===========================================
-- Los usuarios solo pueden eliminar descuentos de su cliente
CREATE POLICY "delete_descuentos_por_cliente"
ON public.descuentos_productos_config
FOR DELETE
USING (
  cliente_id IN (
    SELECT cliente_id 
    FROM public.usuarios 
    WHERE id = auth.uid()
  )
);

